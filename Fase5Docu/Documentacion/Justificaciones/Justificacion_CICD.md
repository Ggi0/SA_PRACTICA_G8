# Justificación de herramienta CI/CD: GitHub Actions

Se utilizó GitHub Actions como herramienta de integración y despliegue continuo del proyecto FilmStars.

GitHub Actions se integra directamente con el repositorio del equipo y permite automatizar pruebas, compilación, generación de artefactos Docker, publicación en registros de contenedores y despliegue hacia distintos ambientes.

---

## ¿Por qué se utilizó GitHub Actions?

Se utilizó porque permite manejar el flujo completo desde el commit hasta el despliegue. Además, soporta:

- Ejecución automática al hacer pull request o push.
- Matrices para ejecutar procesos por servicio.
- Uso de secretos del repositorio.
- Build y push de imágenes Docker.
- Publicación en Docker Hub para `develop`.
- Publicación en Zot/Harbor para `release`.
- Despliegue por SSH hacia VM con Docker Compose.
- Despliegue hacia K3s en AWS usando `kubectl`.
- Rollback automático si un deployment falla.
- Evidencia de pruebas y cobertura como artefactos.

---

## Flujo multi-entorno integrado

| Rama | Flujo | Registry | Entorno | Despliegue |
|---|---|---|---|---|
| `develop` | CI + build + push + deploy staging | Docker Hub | VM / Docker Compose | `docker compose pull` y `up -d` |
| `release` | CI + build + push + deploy cloud | Zot / Harbor | K3s en AWS | `kubectl apply`, RollingUpdate y rollback |

---

## Activación del pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline - FilmStars

on:
  pull_request:
    branches: [develop, release]
  push:
    branches: [develop, release]
```

**Explicación:** el pipeline se ejecuta en pull requests y pushes hacia `develop` y `release`. Esto valida cambios antes de integrarlos y permite desplegar según el ambiente.

---

## Integración continua: build y pruebas

```yaml
ci-tests:
  name: "CI - Build & Tests [${{ matrix.service }}]"
  runs-on: ubuntu-latest
  strategy:
    fail-fast: true
    matrix:
      service:
        - api-gateway
        - users-service
        - movies-service
        - reservas-service
        - payments-service
  defaults:
    run:
      working-directory: Fase3/FilmStars/${{ matrix.service }}
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: "20"

    - name: Install dependencies
      run: npm ci || npm install

    - name: Build
      run: npm run build

    - name: Run tests with coverage when available
      run: |
        if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['test:cov'] ? 0 : 1)"; then
          npm run test:cov
        else
          echo "No test:cov script in ${{ matrix.service }}; build gate already passed."
        fi
```

**Explicación:** la matriz permite ejecutar instalación, build y pruebas para cada servicio. Esto evita duplicar configuración y garantiza que los servicios principales sean validados antes de construir imágenes.

---

## Publicación de imágenes para develop en Docker Hub

```yaml
build-push-dockerhub-develop:
  name: "Develop - Build & Push DockerHub"
  runs-on: ubuntu-latest
  needs: [ci-tests]
  if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
  steps:
    - uses: docker/setup-buildx-action@v3

    - uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Build & Push movies-service
      uses: docker/build-push-action@v5
      with:
        context: Fase3/FilmStars/movies-service
        push: true
        tags: |
          ${{ secrets.DOCKERHUB_USERNAME }}/filmstars-movies-service:latest
          ${{ secrets.DOCKERHUB_USERNAME }}/filmstars-movies-service:${{ steps.meta.outputs.tag }}
```

**Explicación:** para el flujo de `develop`, GitHub Actions construye las imágenes y las publica en Docker Hub. La VM no construye imágenes localmente; solo descarga artefactos ya generados.

---

## Despliegue develop con Docker Compose

```yaml
deploy-develop:
  name: "Develop - Deploy Docker Compose on VM"
  runs-on: ubuntu-latest
  needs: [build-push-dockerhub-develop]
  if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
  steps:
    - name: Pull and restart compose stack
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ needs.provision-infra.outputs.develop_host }}
        username: ubuntu
        key: ${{ secrets.DEVELOP_SSH_KEY }}
        script: |
          cd ~/filmstars
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d --remove-orphans
          docker image prune -f
```

**Explicación:** este flujo representa el despliegue inmutable de staging/réplica. La VM consume imágenes precompiladas, evitando builds manuales o inconsistentes.

---

## Publicación release hacia Zot / Harbor

```yaml
build-push-zot-release:
  name: "Release - Build & Push Zot"
  runs-on: ubuntu-latest
  needs: [ci-tests]
  if: github.ref == 'refs/heads/release' && github.event_name == 'push'
  env:
    TAG: release-${{ github.run_number }}
    ZOT_HOST: ${{ needs.provision-infra.outputs.zot_host }}
    REG: ${{ needs.provision-infra.outputs.zot_host }}/filmstars
```

```yaml
- name: Build and push backend images
  run: |
    push_image() {
      image="$1"
      context="$2"

      docker build -t "$REG/$image:$TAG" -t "$REG/$image:latest" "$context"
      skopeo copy --format oci --dest-tls-verify=false --dest-creds "$ZOT_USER:$ZOT_PASSWORD" "docker-daemon:$REG/$image:$TAG" "docker://$REG/$image:$TAG"
      skopeo copy --format oci --dest-tls-verify=false --dest-creds "$ZOT_USER:$ZOT_PASSWORD" "docker-daemon:$REG/$image:latest" "docker://$REG/$image:latest"
    }

    push_image users-service Fase3/FilmStars/users-service
    push_image movies-service Fase3/FilmStars/movies-service
    push_image reservations-service Fase3/FilmStars/reservas-service
    push_image payments-service Fase3/FilmStars/payments-service
    push_image api-gateway Fase3/FilmStars/api-gateway
```

**Explicación:** en `release`, el pipeline publica imágenes en un registry privado. Esto cumple la restricción de no depender de builds locales y permite mantener artefactos controlados para producción.

---

## Despliegue release en K3s sobre AWS

```yaml
deploy-k3s-release:
  name: "Release - Deploy K3s on AWS"
  runs-on: ubuntu-latest
  needs: [build-push-zot-release]
  if: github.ref == 'refs/heads/release' && github.event_name == 'push'
  env:
    NS: filmstars
    TAG: release-${{ github.run_number }}
    ZOT_HOST: ${{ needs.provision-infra.outputs.zot_host }}
    K3S_IP: ${{ needs.provision-infra.outputs.k3s_ip }}
```

```yaml
- name: Apply applications and Ingress
  run: |
    envsubst '${ZOT_HOST} ${TAG}' < Fase3/FilmStars/k3s/apps.yaml | kubectl apply -f -
    envsubst '${K3S_IP}' < Fase3/FilmStars/k3s/ingress.yaml | kubectl apply -f -
```

**Explicación:** el pipeline aplica los manifiestos Kubernetes sobre el clúster K3s. Las variables de imagen y dominio se sustituyen dinámicamente para desplegar la versión generada.

---

## Configuración segura con Secrets

```yaml
- name: Create Kubernetes Secret from GitHub Secrets
  run: |
    kubectl -n $NS create secret generic filmstars-secrets \
      --from-literal=DB_PASS="$DB_PASS" \
      --from-literal=JWT_SECRET="$JWT_SECRET" \
      --from-literal=RABBITMQ_PASS="$RABBITMQ_PASS" \
      --from-literal=DEFAULT_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
      --dry-run=client -o yaml | kubectl apply -f -
```

**Explicación:** las credenciales no se queman en el código ni en los manifiestos. GitHub Secrets alimenta Kubernetes Secrets durante el despliegue.

---

## Rollback automático

```yaml
- name: Wait rollout and rollback automatically on failure
  run: |
    set -e
    for d in users-service movies-service reservations-service payments-service api-gateway frontend; do
      if ! kubectl -n $NS rollout status deployment/$d --timeout=180s; then
        echo "::error::deployment/$d failed, rolling back"
        kubectl -n $NS rollout undo deployment/$d || true
        kubectl -n $NS rollout status deployment/$d --timeout=120s || true
        exit 1
      fi
    done
```

**Explicación:** si un deployment falla, el pipeline intenta regresar a la última versión estable. Esto reduce el riesgo operativo del entorno release.

---

## Relación con las funcionalidades del sistema

| Funcionalidad | Cómo ayuda GitHub Actions |
|---|---|
| CSV y paginación | Valida que Movies Service compile y pase pruebas antes de desplegar. |
| Pagos y reservas | Ejecuta pruebas de lógica crítica y publicación en colas. |
| Boletos e historial | Permite agregar pruebas antes de habilitar release. |
| Escaneo y control de accesos | Evita desplegar una versión con fallos de validación. |
| Docker Compose | Automatiza el despliegue develop. |
| K3s | Automatiza despliegue release con manifests, Secrets e Ingress. |

---

## Conclusión

GitHub Actions se utiliza porque integra pruebas, build, publicación de imágenes y despliegue en un solo flujo controlado desde el repositorio. La misma herramienta cubre el ciclo completo: valida servicios, genera imágenes inmutables, publica artefactos, despliega `develop` con Docker Compose y despliega `release` en K3s con rollback. Así el proyecto evita builds manuales, reduce errores y mantiene trazabilidad desde el commit hasta el despliegue.
