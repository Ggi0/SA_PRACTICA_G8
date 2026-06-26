# Requerimientos Actualizados
## Requerimientos Funcionales (RF)

| Código | Servicio Asociado | Prioridad | Requerimiento |
|---|---|---|---|
| RF-01 | Servicio de Usuario | Alta | El sistema debe permitir la gestión de usuarios. |
| RF-02 | Servicio de Usuario | Alta | El sistema debe permitir identificar al usuario que realiza la compra del boleto. |
| RF-03 | Servicio de Usuario | Media | El sistema debe permitir consultar la información del usuario cuando se asocia una reserva o compra. |
| RF-04 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir seleccionar una ubicación. |
| RF-05 | Servicio de Películas/Cartelera | Alta | El sistema debe mostrar las funciones disponibles según el cine seleccionado. |
| RF-06 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al usuario consultar la cartelera de películas. |
| RF-07 | Servicio de Películas/Cartelera | Alta | El sistema debe clasificar las películas por categoría: estrenos, pre-ventas y re-estrenos. |
| RF-08 | Servicio de Películas/Cartelera | Media | El sistema debe permitir al usuario visualizar las películas clasificadas como estrenos. |
| RF-09 | Servicio de Películas/Cartelera | Media | El sistema debe permitir visualizar las películas clasificadas como reestrenos. |
| RF-10 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir seleccionar una función específica de una película. |
| RF-11 | Servicio de Películas/Cartelera | Alta | El sistema debe mostrar los cines disponibles según la ubicación seleccionada. |
| RF-12 | Servicio de Películas/Cartelera | Alta | El sistema debe mostrar los horarios disponibles para cada función. |
| RF-13 | Servicio de Películas/Cartelera | Media | El sistema debe permitir visualizar las películas clasificadas como pre-ventas. |
| RF-14 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir seleccionar una película de la cartelera. |
| RF-15 | Servicio de Reservas/Asientos | Alta | El sistema debe mostrar el mapa interactivo de la sala que corresponde a la función seleccionada. |
| RF-16 | Servicio de Reservas/Asientos | Alta | El sistema debe permitir seleccionar uno o varios asientos, siempre que estos estén disponibles. |
| RF-17 | Servicio de Reservas/Asientos | Alta | El sistema debe validar la disponibilidad real de los asientos antes de confirmar la reserva. |
| RF-18 | Servicio de Reservas/Asientos | Alta | El sistema debe rechazar la reserva cuando uno o más asientos ya no estén disponibles. |
| RF-19 | Servicio de Reservas/Asientos | Alta | El sistema debe evitar que dos usuarios puedan confirmar la compra del mismo asiento cuando seleccionan la misma función. |
| RF-20 | Servicio de Reservas/Asientos | Alta | El sistema debe mostrar el estado de cada asiento de manera visual. |
| RF-21 | Servicio de Reservas/Asientos | Alta | El sistema debe bloquear temporalmente los asientos seleccionados durante el proceso de compra para evitar que sean seleccionados por otro usuario. |
| RF-22 | Servicio de Reservas/Asientos | Alta | El sistema debe enviar la solicitud de reserva de asientos a una cola de mensajería para su procesamiento. |
| RF-23 | Servicio de Reservas/Asientos | Alta | El sistema debe confirmar la reserva cuando los asientos seleccionados estén disponibles. |
| RF-24 | Servicio de Reservas/Asientos | Alta | El sistema debe liberar automáticamente los asientos bloqueados cuando el tiempo de reserva temporal haya vencido o cuando no se proceda con la compra. |
| RF-25 | Servicio de Pagos | Alta | El sistema debe permitir procesar un pago simulado para una reserva confirmada. |
| RF-26 | Servicio de Pagos | Alta | El sistema debe registrar la transacción de pago realizada. |
| RF-27 | Servicio de Pagos | Alta | El sistema debe confirmar la compra cuando el pago sea exitoso. |
| RF-28 | Servicio de Pagos | Alta | El sistema debe emitir el boleto final cuando la compra haya sido exitosa. |
| RF-29 | Servicio de Pagos | Alta | El sistema debe validar el resultado del pago simulado. |
| RF-30 | Servicio de Pagos | Alta | El sistema debe asociar la transacción registrada a la reserva. |
| RF-31 | Servicio de Pagos | Alta | El sistema debe rechazar o cancelar la compra cuando el pago no haya sido satisfactorio. |
| RF-32 | Servicio de Pagos | Media | El sistema debe permitir realizar una consulta del estado de la reservación: aprobada, rechazada o pendiente. |
| RF-33 | Servicio de Usuario | Alta | El sistema debe permitir el registro de usuarios mediante formulario con validaciones. |
| RF-34 | Servicio de Usuario | Alta | El sistema debe almacenar las contraseñas de los usuarios de forma segura mediante hash. |
| RF-35 | Servicio de Usuario | Alta | El sistema debe permitir iniciar sesión validando las credenciales del usuario. |
| RF-36 | Servicio de Usuario | Alta | El sistema debe generar y retornar un token JWT después de un inicio de sesión exitoso. |
| RF-37 | API Gateway / Frontend | Alta | El sistema debe enviar el token JWT en la cabecera `Authorization: Bearer <token>` para acceder a rutas protegidas. |
| RF-38 | API Gateway | Alta | El sistema debe validar el JWT antes de permitir el acceso a rutas protegidas como gestión de usuarios, selección de asientos y flujo de compra. |
| RF-39 | API Gateway | Media | El sistema debe funcionar como punto de entrada único para enrutar las peticiones del frontend hacia los servicios internos. |
| RF-40 | Frontend / API Gateway | Alta | El sistema debe permitir el acceso a un panel de administración únicamente a usuarios autenticados con rol `Admin`. |
| RF-41 | Frontend | Alta | El sistema debe ocultar o restringir las vistas administrativas a usuarios que no posean rol `Admin`. |
| RF-42 | API Gateway / Backend SOA | Alta | El sistema debe validar en cada endpoint administrativo que el JWT pertenezca a un usuario con rol `Admin`. |
| RF-43 | API Gateway / Backend SOA | Alta | El sistema debe denegar el acceso a endpoints administrativos cuando el usuario no esté autenticado o no tenga rol `Admin`. |
| RF-44 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador crear nuevos cines |
| RF-45 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador consultar cines registrados. |
| RF-46 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador actualizar la información de un cine existente. |
| RF-47 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador eliminar o desactivar cines registrados. |
| RF-48 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador crear salas asociadas a un cine. |
| RF-49 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador consultar las salas registradas por cine. |
| RF-50 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador actualizar la información de una sala existente. |
| RF-51 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador eliminar o desactivar salas registradas. |
| RF-52 | Servicio de Películas/Cartelera / Reservas | Alta | El sistema debe permitir configurar el mapa base de asientos de una sala. |
| RF-53 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador asignar películas a salas específicas. |
| RF-54 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador crear horarios y funciones para una película. |
| RF-55 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador actualizar horarios y funciones existentes. |
| RF-56 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir al administrador eliminar, cancelar o desactivar funciones programadas. |
| RF-57 | Servicio de Películas/Cartelera | Alta | El sistema debe validar que no existan dos funciones en la misma sala y horario. |
| RF-58 | Servicio de Películas/Cartelera | Alta | El sistema debe permitir definir si una función corresponde a Estreno, Pre-venta o Re-estreno. |
| RF-59 | Servicio de Reservas/Asientos | Alta | El sistema debe generar o actualizar la disponibilidad de asientos de una función con base en el mapa de asientos de la sala asignada. |
| RF-60 | Frontend / Módulo Administrativo | Alta | El sistema debe permitir al administrador cargar un archivo `.csv` desde el panel administrativo para registrar múltiples películas de forma simultánea. |
| RF-61 | Servicio de Películas / Cartelera | Alta | El sistema debe procesar archivos CSV que contengan registros de películas normalizados. |
| RF-62 | Servicio de Películas / Cartelera | Alta | El sistema debe validar la estructura del archivo CSV antes de insertar información en la base de datos. |
| RF-63 | Servicio de Películas / Cartelera | Alta | El sistema debe validar campos obligatorios por cada película importada, como título, duración, clasificación, fecha de estreno y tipo de función. |
| RF-64 | Servicio de Películas / Cartelera | Alta | El sistema debe rechazar registros inválidos del CSV e informar el motivo del error al administrador. |
| RF-65 | Servicio de Películas / Cartelera | Alta | El sistema debe permitir al administrador mantener la carga manual de películas una a una, además de la carga masiva por CSV. |
| RF-66 | Servicio de Películas / Cartelera | Alta | El sistema debe registrar las películas válidas del archivo CSV en la base de datos `filmstars_movies`. |
| RF-67 | Servicio de Películas / Cartelera | Media | El sistema debe mostrar un resumen de importación indicando registros procesados, registros exitosos y registros rechazados. |
| RF-68 | Servicio de Películas / Cartelera | Media | El sistema debe evitar duplicidad de películas cuando el archivo CSV contenga títulos ya registrados bajo los criterios definidos por el equipo. |
| RF-69 | Frontend / Servicio de Películas | Alta | El sistema debe implementar paginación del lado del servidor en la vista general de cartelera. |
| RF-70 | Servicio de Películas / Cartelera | Alta | El sistema debe retornar un máximo de 10 películas por página desde el backend. |
| RF-71 | Servicio de Películas / Cartelera | Alta | El sistema debe aceptar parámetros de consulta como `page`, `limit`, `category`, `city` y `search` para filtrar y paginar el catálogo. |
| RF-72 | Frontend | Alta | El sistema debe mostrar controles de paginación: página actual, siguiente, anterior y total de páginas. |
| RF-73 | Frontend / Servicio de Películas | Alta | El sistema debe conservar la paginación cuando el usuario aplique filtros por ciudad, búsqueda o tipo de función. |
| RF-74 | Servicio de Películas / Cartelera | Alta | El sistema debe evitar enviar todo el catálogo al frontend para paginar en cliente. |
| RF-75 | API Gateway | Alta | El sistema debe enrutar las peticiones paginadas de catálogo hacia el servicio de películas preservando los parámetros de consulta. |
| RF-76 | Pipeline CI/CD | Alta | El sistema debe ejecutar automáticamente pruebas unitarias cuando exista push o merge hacia la rama correspondiente. |
| RF-77 | Pipeline CI/CD | Alta | El sistema debe construir imágenes Docker de frontend y servicios backend únicamente dentro del pipeline. |
| RF-78 | Pipeline CI/CD / Docker Hub | Alta | El sistema debe publicar las imágenes generadas en Docker Hub con el tag `latest`. |
| RF-79 | Pipeline CI/CD / VM | Alta | El sistema debe desplegar en la VM mediante Docker Compose descargando imágenes precompiladas desde Docker Hub. |
| RF-80 | Pipeline CI/CD | Alta | El sistema debe cancelar el despliegue si las pruebas fallan o la cobertura baja del 75%. |
| RF-81 | Documentación | Media | El sistema debe documentar el formato esperado del CSV y los criterios de validación usados por el motor de carga masiva. |
| RF-82 | Frontend / Servicio de Pagos | Alta | El sistema debe permitir al usuario descargar inmediatamente su boleto después de una compra exitosa. |
| RF-83 | Servicio de Pagos | Alta | El sistema debe generar un boleto digital descargable en formato PDF o imagen legible. |
| RF-84 | Servicio de Pagos | Alta | El sistema debe incluir en el boleto un código QR o código de barras único que contenga o represente de forma segura el identificador del boleto. |
| RF-85 | Servicio de Pagos / Reservas | Alta | El sistema debe asociar cada boleto generado con la compra, usuario, función, película y asientos correspondientes. |
| RF-86 | Frontend / Servicio de Usuario | Alta | El sistema debe proporcionar al cliente una sección de historial de compras. |
| RF-87 | Frontend / Servicio de Pagos | Alta | El sistema debe permitir al usuario consultar y descargar boletos generados previamente desde el historial de compras. |
| RF-88 | Servicio de Pagos / API Gateway | Alta | El sistema debe validar que únicamente el propietario del boleto o un administrador autorizado pueda consultar o descargar un boleto. |
| RF-89 | Servicio de Pagos | Alta | El sistema debe manejar estados de boleto como generado, válido, usado o inválido. |
| RF-90 | Frontend / Módulo Administrativo | Alta | El sistema debe permitir al administrador validar boletos desde el panel administrativo simulando un escáner de códigos de acceso. |
| RF-91 | API Gateway / Servicio de Pagos | Alta | El sistema debe validar el JWT y el rol `Admin` antes de permitir operaciones de escaneo o control de accesos. |
| RF-92 | Servicio de Pagos | Alta | El sistema debe validar si el boleto escaneado existe, pertenece a una compra registrada y no ha sido utilizado previamente. |
| RF-93 | Servicio de Pagos | Alta | El sistema debe rechazar boletos usados, inválidos o inexistentes mostrando un mensaje claro al administrador. |
| RF-94 | Servicio de Reservas / Asientos | Alta | El sistema debe actualizar el estado del asiento a `EN_USO` cuando un boleto válido sea escaneado correctamente. |
| RF-95 | Servicio de Pagos | Alta | El sistema debe marcar de forma irreversible el boleto como `USADO` o `INVÁLIDO` después de una validación exitosa para impedir su reutilización. |
| RF-96 | Servicio de Pagos / Auditoría | Alta | El sistema debe registrar una auditoría de acceso por cada intento de validación de boleto, incluyendo resultado, fecha, boleto y administrador responsable. |
| RF-97 | Frontend / Módulo Administrativo | Alta | El sistema debe permitir búsqueda manual de boletos por ID de boleto, rango de fechas y película ante fallos de lectura o contingencias. |
| RF-98 | Servicio de Pagos | Alta | El sistema debe consultar boletos mediante filtros combinados para apoyar la resolución manual de incidencias. |
| RF-99 | Módulo Administrativo / Servicio de Pagos | Alta | El sistema debe permitir al administrador forzar manualmente la validación de un boleto existente y válido cuando el escaneo automático falle. |
| RF-100 | Servicio de Reservas / Asientos | Alta | El sistema debe actualizar el asiento a `EN_USO` cuando el administrador fuerce manualmente una validación válida. |
| RF-101 | Pipeline CI/CD | Alta | El sistema debe diferenciar el flujo de `develop` y `release` dentro del pipeline de CI/CD. |
| RF-102 | Pipeline CI/CD / Docker Compose | Alta | Ante un push en `develop`, el sistema debe construir imágenes y desplegar el entorno de réplica o staging mediante Docker Compose usando únicamente `pull` desde un registro privado. |
| RF-103 | Pipeline CI/CD / K3s | Alta | Ante un push en `release`, el sistema debe ejecutar pruebas con cobertura mínima del 75%, construir imágenes inmutables y desplegar en un clúster K3s sobre AWS. |
| RF-104 | Registry Privado | Alta | El sistema debe publicar las imágenes de producción en un registro privado de contenedores como Harbor o Zot. |
| RF-105 | K3s / Kubernetes | Alta | El sistema debe incluir manifiestos YAML para Deployments, Services, ConfigMaps, Secrets e Ingress. |
| RF-106 | K3s / Kubernetes | Alta | El sistema debe exponer el frontend y las APIs mediante un Ingress Controller con rutas o dominios lógicos. |
| RF-107 | K3s / Kubernetes | Alta | El sistema debe administrar configuración estática mediante ConfigMaps. |
| RF-108 | K3s / Kubernetes | Alta | El sistema debe administrar información sensible mediante Secrets nativos de Kubernetes. |
| RF-109 | K3s / Kubernetes | Alta | El sistema debe soportar estrategia RollingUpdate para despliegues sin interrupción. |
| RF-110 | K3s / Kubernetes | Alta | El sistema debe permitir rollback hacia la última versión estable mediante `kubectl rollout undo` cuando falle una nueva versión. |
| RF-111 | Documentación | Media | El sistema debe documentar la arquitectura del clúster, namespaces, pods, Services, Ingress, ConfigMaps, Secrets y estrategia de despliegue zero-downtime. |
| RF-112 | Terraform / AWS | Alta | El sistema debe permitir aprovisionar la infraestructura base de AWS mediante Terraform, incluyendo VPC, subredes, Internet Gateway, Security Groups e instancias EC2 necesarias para los entornos `develop` y `release`. |
| RF-113 | Terraform / AWS | Alta | El sistema debe generar salidas de Terraform con información necesaria para el despliegue, como IPs públicas, nombres de instancias, identificadores de red y datos requeridos por Ansible. |
| RF-114 | Terraform | Alta | El sistema debe mantener la definición declarativa de la infraestructura en archivos `.tf`, evitando la creación manual de recursos desde la consola de AWS. |
| RF-115 | Ansible / AWS EC2 | Alta | El sistema debe ejecutar playbooks de Ansible para configurar automáticamente las instancias EC2 aprovisionadas por Terraform. |
| RF-116 | Ansible / K3s | Alta | El sistema debe instalar y configurar K3s mediante Ansible en las instancias destinadas al entorno `release`. |
| RF-117 | Ansible / Servidores | Alta | El sistema debe instalar dependencias base requeridas por la aplicación, como Docker, herramientas de Kubernetes, cliente de conexión, configuración de usuarios y paquetes necesarios para la operación. |
| RF-118 | CI/CD / Terraform | Alta | El pipeline debe ejecutar una fase de validación y planificación de Terraform antes de aplicar cambios de infraestructura. |
| RF-119 | CI/CD / Terraform / Ansible | Alta | El pipeline debe ejecutar Terraform para aprovisionar o actualizar infraestructura y posteriormente ejecutar Ansible para configurar los servidores. |
| RF-120 | CI/CD / Ansible | Alta | El pipeline debe utilizar las salidas de Terraform como insumo para generar o actualizar el inventario de Ansible. |
| RF-121 | CI/CD / AWS | Alta | El sistema debe desplegar el entorno `develop` en una VM EC2, eliminando la dependencia de un entorno local como destino principal de despliegue. |
| RF-122 | CI/CD / K3s | Alta | El sistema debe desplegar el entorno `release` sobre el clúster K3s aprovisionado y configurado en AWS mediante Terraform y Ansible. |
| RF-123 | Backend SOA / Observabilidad | Alta | Los servicios backend deben exponer métricas de operación que puedan ser recolectadas por Prometheus, incluyendo disponibilidad, errores y latencia de APIs. |
| RF-124 | Prometheus / K3s | Alta | El sistema debe desplegar Prometheus dentro del entorno K3s para recolectar métricas del clúster, pods, servicios, APIs y componentes de soporte. |
| RF-125 | Prometheus / RabbitMQ | Alta | El sistema debe permitir monitorear métricas de RabbitMQ, como estado del broker, colas activas, mensajes pendientes y saturación de colas. |
| RF-126 | Prometheus / K3s | Alta | El sistema debe recolectar métricas de uso de CPU y memoria de los pods relacionados con frontend, API Gateway y servicios backend. |
| RF-127 | Prometheus / Ingress | Media | El sistema debe recolectar o exponer información relacionada con el estado del Ingress y la disponibilidad de entrada hacia frontend y APIs. |
| RF-128 | Grafana / K3s | Alta | El sistema debe desplegar Grafana conectado a Prometheus como origen de datos para visualizar métricas operativas del sistema. |
| RF-129 | Grafana | Alta | El sistema debe incluir al menos un dashboard personalizado que muestre la salud del sistema, consumo de CPU/RAM, estado de pods, volumen de boletos validados por minuto y estado del Ingress. |
| RF-130 | Módulo Administrativo / Cámara | Alta | El panel administrativo debe permitir validar boletos mediante lectura de código QR usando cámara o simulación equivalente del escáner. |
| RF-131 | Módulo Administrativo / Observabilidad | Media | El sistema debe registrar métricas relacionadas con validaciones de boletos, incluyendo validaciones exitosas, rechazadas y forzadas manualmente. |
| RF-132 | Documentación / Terraform | Media | El sistema debe documentar qué es Terraform, cómo funciona, cómo se organiza la infraestructura y el paso a paso de ejecución con evidencias de recursos creados. |
| RF-133 | Documentación / Ansible | Media | El sistema debe documentar qué es Ansible, cómo funcionan los playbooks y el paso a paso de configuración de servidores, K3s y dependencias con evidencias de ejecución. |
| RF-134 | Documentación / Prometheus y Grafana | Media | El sistema debe documentar el despliegue de Prometheus y Grafana, el modelo de scraping, los exporters utilizados y capturas del dashboard funcionando con telemetría viva. |
| RF-135 | Seguridad / Configuración | Alta | El sistema debe utilizar archivos `.env`, GitHub Secrets, Kubernetes Secrets o mecanismos equivalentes para manejar URLs, contraseñas, IPs y llaves sensibles sin subirlas al repositorio. |

## Requerimientos NO Funcionales (RNF)

| Código | Categoría | Prioridad | Requerimiento |
|---|---|---|---|
| RNF-01 | Arquitectura | Alta | El sistema se implementará con un enfoque de Arquitectura Orientada a Servicios de la siguiente forma: Usuarios, Películas/Cartelera, Reservas/Asientos y Pagos. |
| RNF-02 | Modularidad | Alta | Cada servicio se trabajará como un modelo de servicio independiente. |
| RNF-03 | Comunicación Asíncrona | Alta | La comunicación crítica entre servicios debe realizarse de forma asíncrona mediante colas de mensajería. |
| RNF-04 | Middleware | Alta | El sistema utilizará un middleware de mensajería basado en colas, específicamente RabbitMQ. |
| RNF-05 | No bloqueo | Alta | Las peticiones críticas no deben bloquear el hilo principal de la aplicación; deben ingresar a una cola para ser procesadas por consumidores independientes. |
| RNF-06 | Concurrencia | Alta | El sistema debe impedir que ocurran conflictos de concurrencia cuando varios usuarios seleccionen asientos al mismo tiempo. |
| RNF-07 | Integridad | Alta | El sistema debe garantizar que las operaciones financieras no se pierdan en caso de fallos parciales o caídas del sistema. |
| RNF-08 | Consistencia | Alta | El sistema debe asegurar que un mismo asiento no pueda ser asignado a más de un usuario en la misma función. |
| RNF-09 | Alta demanda | Alta | El sistema debe estar preparado para manejar picos elevados de actividad durante la consulta de cartelera, la selección de asientos y la compra de boletos. |
| RNF-10 | Rendimiento | Media | Las consultas de cartelera, cines y funciones deben responder en un máximo de dos segundos bajo condiciones normales. |
| RNF-11 | Rendimiento | Alta | El mapa de asientos debe mostrar resultados en un tiempo aproximado de dos segundos bajo carga estándar. |
| RNF-12 | Tolerancia a fallos | Alta | Si el servicio de pago o reserva presenta una falla temporal, los mensajes deben mantenerse en cola o poder reprocesarse sin perder la solicitud. |
| RNF-13 | Seguridad | Alta | El sistema debe proteger la información del usuario y las transacciones mediante autenticación o control de sesión. |
| RNF-14 | Seguridad | Alta | Solo usuarios o procesos autorizados pueden ejecutar operaciones sensibles como confirmar reservas o procesar pagos. |
| RNF-15 | Mantenibilidad | Alta | El código debe estructurarse por servicios o módulos con responsabilidades claramente definidas. |
| RNF-16 | Contenedores | Alta | Las modificaciones y servicios deben ejecutarse dentro de contenedores para facilitar su despliegue y administración. |
| RNF-17 | Interoperabilidad | Alta | Los servicios deben ofrecer interfaces de comunicación claras mediante mensajería asíncrona. |
| RNF-18 | Seguridad JWT | Alta | El sistema debe utilizar JWT para representar los claims esenciales del usuario, como ID, nombre, correo y rol. |
| RNF-19 | Seguridad de credenciales | Alta | Las contraseñas no deben almacenarse en texto plano; deben almacenarse mediante hash seguro. |
| RNF-20 | Docker Compose | Alta | El sistema debe poder levantarse localmente mediante `docker compose up --build`, incluyendo frontend, servicios backend, bases de datos y RabbitMQ. |
| RNF-21 | Calidad de código | Alta | El código debe evidenciar aplicación de principios SOLID mediante separación de responsabilidades, interfaces e inyección de dependencias. |
| RNF-22 | API Gateway | Media | El frontend debe comunicarse preferentemente con el API Gateway y no directamente con los servicios internos. |
| RNF-23 | Persistencia independiente | Alta | Cada servicio debe contar con su propia base de datos o lógica de acceso a datos. |
| RNF-24 | Trazabilidad | Media | Los procesos críticos de reserva, pago y emisión de boleto deben registrar eventos o estados que permitan seguimiento del flujo. |
| RNF-25 | Seguridad | Alta | Las rutas administrativas deben protegerse mediante control de acceso basado en roles. |
| RNF-26 | Seguridad | Alta | El JWT debe incluir los claims necesarios para validar identidad y rol del usuario, especialmente el rol `Admin`. |
| RNF-27 | Seguridad | Alta | La validación de rol administrador debe aplicarse tanto en frontend como en backend, evitando acceso directo a vistas o APIs administrativas. |
| RNF-28 | Calidad | Alta | El backend debe contar con pruebas unitarias automatizadas para validar lógica de negocio crítica. |
| RNF-29 | Cobertura | Alta | Las pruebas unitarias deben alcanzar como mínimo un 75% de cobertura en los componentes principales del backend. |
| RNF-30 | Calidad | Alta | El pipeline debe ejecutar automáticamente la instalación de dependencias, compilación y pruebas unitarias. |
| RNF-31 | Control de calidad | Alta | El pipeline debe detenerse si alguna prueba falla o si la cobertura es menor al 75%. |
| RNF-32 | CI/CD | Alta | El proyecto debe contar con un pipeline de CI/CD, preferiblemente mediante GitHub Actions. |
| RNF-33 | Monitoreo | Media | El sistema debe generar reportes o logs legibles de ejecución de pruebas y cobertura. |
| RNF-34 | DevOps | Alta | Cada componente independiente debe contar con su Dockerfile correspondiente. |
| RNF-35 | Docker Compose | Alta | El archivo `docker-compose.yml` debe permitir replicar el entorno completo de manera local con un solo comando. |
| RNF-36 | Despliegue | Alta | El proyecto debe documentar el flujo de despliegue desde GitHub hacia el entorno definido por el equipo. |
| RNF-37 | Trazabilidad | Media | La documentación debe incluir el flujo desde commit, Pull Request, ejecución del pipeline, pruebas y despliegue. |
| RNF-38 | Rendimiento | Alta | Las consultas paginadas de cartelera deben responder en un tiempo aceptable bajo condiciones normales de uso, evitando transferir catálogos completos al frontend. |
| RNF-39 | Paginación | Alta | La paginación debe realizarse obligatoriamente en el backend mediante `LIMIT/OFFSET` o estrategia equivalente. |
| RNF-40 | Escalabilidad | Alta | El catálogo debe soportar crecimiento de registros sin degradar significativamente la experiencia del usuario. |
| RNF-41 | Usabilidad | Media | Los controles de paginación deben ser claros y mantenerse funcionales al aplicar filtros. |
| RNF-42 | Integridad de datos | Alta | La carga CSV debe validar estructura, tipos de datos y campos obligatorios antes de registrar películas. |
| RNF-43 | Tolerancia a errores | Alta | El sistema debe manejar errores de CSV sin interrumpir el funcionamiento general del servicio de cartelera. |
| RNF-44 | Observabilidad | Media | El resultado de una carga masiva debe dejar evidencia de registros exitosos y rechazados. |
| RNF-45 | Seguridad | Alta | La carga masiva de películas por CSV debe estar disponible únicamente para usuarios con rol `Admin`. |
| RNF-46 | Seguridad | Alta | El backend debe validar el JWT y rol `Admin` aunque el frontend oculte la opción de carga CSV. |
| RNF-47 | DevOps | Alta | Las imágenes Docker deben construirse exclusivamente en el pipeline CI/CD, no directamente en la VM de producción. |
| RNF-48 | Infraestructura inmutable | Alta | El despliegue en producción debe usar imágenes precompiladas desde Docker Hub mediante `image: usuario/servicio:tag`. |
| RNF-49 | Docker Hub | Alta | Docker Hub debe funcionar como registro público de artefactos para frontend y servicios backend. |
| RNF-50 | CI/CD | Alta | El pipeline debe ejecutar secuencialmente las fases de Test, Build & Push y Deploy. |
| RNF-51 | Cobertura | Alta | La fase de pruebas debe cancelar el pipeline si la cobertura de endpoints o componentes utilizados es menor al 75%. |
| RNF-52 | Despliegue | Alta | El despliegue hacia la VM debe realizarse por `pull` de imágenes y reinicio de contenedores mediante Docker Compose. |
| RNF-53 | Ambientes | Media | El proyecto debe diferenciar el flujo de despliegue hacia `develop` y `release` según el ambiente definido por el equipo. |
| RNF-54 | Mantenibilidad | Alta | La lectura de CSV y la paginación deben implementarse con separación de responsabilidades y principios SOLID. |
| RNF-55 | Versionamiento | Media | La entrega debe preparar el tag de versión `V2.2.0`. |
| RNF-56 | Seguridad / Antifraude | Alta | Los boletos deben tener un identificador único que impida su reutilización después de ser validados. |
| RNF-57 | Integridad | Alta | La validación exitosa de un boleto debe dejar consistente el estado del boleto y el estado del asiento asociado. |
| RNF-58 | Trazabilidad | Alta | Todo intento de escaneo o validación manual debe registrarse para auditoría. |
| RNF-59 | Tolerancia a errores | Alta | El sistema debe manejar boletos inexistentes, usados, inválidos o errores de lectura sin interrumpir el módulo administrativo. |
| RNF-60 | Rendimiento | Media | La búsqueda manual de boletos debe apoyarse en filtros indexables como ID de boleto, fecha y película. |
| RNF-61 | Usabilidad | Media | El historial de compras debe permitir localizar y descargar boletos de forma clara para el usuario. |
| RNF-62 | Seguridad | Alta | La descarga de boletos debe estar protegida para evitar que un usuario acceda a boletos de terceros. |
| RNF-63 | Consistencia transaccional | Alta | Un boleto marcado como usado no debe volver a estado válido salvo por intervención técnica controlada fuera del flujo normal. |
| RNF-64 | Observabilidad | Media | Los errores de validación, escaneo y búsqueda manual deben quedar disponibles en logs o registros de auditoría. |
| RNF-65 | Orquestación | Alta | El entorno productivo debe ejecutarse sobre un clúster K3s en AWS. |
| RNF-66 | Alta disponibilidad | Alta | Los servicios críticos deben definirse mediante Deployments con réplicas configurables. |
| RNF-67 | Red interna | Alta | La comunicación entre pods debe realizarse mediante Services de Kubernetes, priorizando ClusterIP para tráfico interno. |
| RNF-68 | Entrada de tráfico | Alta | El tráfico externo debe centralizarse mediante un Ingress Controller. |
| RNF-69 | Configuración | Alta | Las variables estáticas deben gestionarse mediante ConfigMaps y no estar quemadas en los manifiestos. |
| RNF-70 | Seguridad de secretos | Alta | Las credenciales, llaves JWT, strings de conexión y contraseñas deben gestionarse mediante Secrets. |
| RNF-71 | Seguridad de información | Alta | La información sensible debe permanecer en archivos `.env` o Secrets y no debe subirse al repositorio. |
| RNF-72 | Infraestructura inmutable | Alta | El entorno de producción no debe construir imágenes localmente; debe consumir imágenes precompiladas desde un registry privado. |
| RNF-73 | Registry privado | Alta | El flujo de producción debe utilizar Harbor o Zot como registro privado de contenedores. |
| RNF-74 | CI/CD multi-entorno | Alta | El pipeline debe separar el despliegue de `develop` hacia Docker Compose y `release` hacia K3s en AWS. |
| RNF-75 | Cobertura | Alta | El flujo de `release` debe cancelar el despliegue si la cobertura de pruebas es menor al 75%. |
| RNF-76 | Zero-Downtime | Alta | Los despliegues en K3s deben utilizar RollingUpdate con parámetros `maxSurge` y `maxUnavailable`. |
| RNF-77 | Recuperación | Alta | El pipeline o el operador debe contar con un flujo de rollback usando `kubectl rollout undo` ante fallos de arranque o crash loops. |
| RNF-78 | Aislamiento | Media | Los entornos o componentes deben poder organizarse mediante namespaces de Kubernetes. |
| RNF-79 | Recursos | Media | Los pods deben documentar asignación de recursos de CPU y memoria para evitar consumo no controlado. |
| RNF-80 | Documentación técnica | Alta | Deben cargarse al repositorio los archivos crudos de diagramas y manifiestos de orquestación. |
| RNF-81 | Restricción operativa | Alta | Las construcciones de imágenes Docker deben realizarse exclusivamente por medio del CI/CD. |
| RNF-82 | Infraestructura como Código | Alta | Toda la infraestructura de AWS debe definirse mediante Terraform y no debe ser creada manualmente desde la consola web. |
| RNF-83 | Reproducibilidad | Alta | La infraestructura debe poder recrearse de forma consistente a partir de los archivos `.tf` del repositorio. |
| RNF-84 | Modularidad IaC | Media | Los manifiestos de Terraform deben organizarse de forma modular, separando red, seguridad, cómputo, variables y salidas. |
| RNF-85 | Gestión de estado | Alta | El estado de Terraform debe gestionarse y documentarse para evitar pérdida de control sobre los recursos aprovisionados. |
| RNF-86 | Automatización | Alta | La configuración de servidores debe realizarse mediante playbooks de Ansible y no por comandos manuales repetitivos. |
| RNF-87 | Idempotencia | Alta | Los playbooks de Ansible deben poder ejecutarse más de una vez sin generar configuraciones inconsistentes. |
| RNF-88 | Cero clics manuales | Alta | El despliegue de `develop` y `release` hacia AWS debe ejecutarse sin clics manuales, utilizando CI/CD, Terraform y Ansible. |
| RNF-89 | Nube | Alta | El entorno `develop` debe ejecutarse en una VM EC2 y el entorno `release` en K3s sobre AWS. |
| RNF-90 | Observabilidad | Alta | El entorno productivo K3s debe contar con una pila de observabilidad centralizada basada en Prometheus y Grafana. |
| RNF-91 | Retención de métricas | Media | El tiempo de retención de métricas en Prometheus debe definirse y documentarse según la capacidad del entorno y las necesidades del equipo. |
| RNF-92 | Scraping | Alta | Prometheus debe recolectar métricas periódicamente desde el clúster K3s, servicios de la aplicación y componentes de soporte como RabbitMQ. |
| RNF-93 | Visualización | Alta | Grafana debe mostrar dashboards dinámicos con métricas en tiempo real del sistema de cine. |
| RNF-94 | Métricas de aplicación | Alta | Los servicios deben exponer métricas internas relacionadas con disponibilidad, latencia, errores y validación de boletos. |
| RNF-95 | Métricas de infraestructura | Alta | El monitoreo debe incluir CPU, memoria y estado de pods del frontend, API Gateway y servicios backend. |
| RNF-96 | Métricas de mensajería | Alta | El monitoreo debe incluir estado y saturación de colas en RabbitMQ o middleware equivalente. |
| RNF-97 | Métricas de acceso | Media | El monitoreo debe incluir métricas del Ingress o punto de entrada externo del sistema. |
| RNF-98 | Resiliencia operativa | Alta | La plataforma debe permitir detectar fallos de servicios, saturación de recursos o errores elevados antes de que afecten la venta de boletos. |
| RNF-99 | Seguridad de secretos | Alta | Contraseñas, tokens, IPs, llaves JWT, usuarios de registry y credenciales cloud no deben subirse al repositorio. |
| RNF-100 | Seguridad de red | Alta | Los Security Groups definidos por Terraform deben limitar el tráfico únicamente a los puertos necesarios para operación, administración y monitoreo. |
| RNF-101 | Trazabilidad DevOps | Alta | El pipeline debe dejar evidencia de ejecución de Terraform, Ansible, pruebas, build, publicación de imágenes y despliegue. |
| RNF-102 | Documentación técnica | Alta | La documentación debe incluir archivos crudos, diagramas, guías y capturas que evidencien Terraform, Ansible, Prometheus y Grafana. |
| RNF-103 | Calidad SOLID | Alta | La instrumentación de métricas y nuevos módulos de observabilidad deben mantener separación de responsabilidades e inyección de dependencias. |
| RNF-104 | Continuidad del sistema | Alta | Todos los elementos implementados en prácticas anteriores deben persistir y operar sobre la infraestructura aprovisionada por código. |
| RNF-105 | Restricción operativa | Alta | No se deben ejecutar commits, despliegues, accionamientos de CI/CD ni levantamiento de infraestructura fuera del horario establecido. |
| RNF-106 | Evidencia visual | Media | La documentación de Terraform, Ansible, Prometheus y Grafana debe incluir capturas de recursos, logs de playbooks y dashboards activos. |
| RNF-107 | Disponibilidad de monitoreo | Alta | Prometheus y Grafana deben permanecer disponibles dentro del entorno productivo para consultar la salud del sistema durante la calificación. |
| RNF-108 | Rendimiento de monitoreo | Media | La recolección de métricas no debe degradar de forma significativa el rendimiento de los servicios principales de FilmStars. |

## Resumen de cambios

En esta práctica se agregaron requerimientos orientados a consolidar la plataforma en un entorno cloud automatizado y observable:

1. **Infraestructura como Código y automatización:** se agregó Terraform para aprovisionar recursos AWS y Ansible para configurar servidores, instalar dependencias y desplegar K3s sin configuraciones manuales.
2. **CI/CD extendido:** el pipeline debe ejecutar fases de Terraform, Ansible y despliegue hacia AWS, diferenciando `develop` en EC2 y `release` en K3s.
3. **Observabilidad:** se agregó Prometheus para recolección de métricas y Grafana para dashboards en tiempo real.
4. **Métricas operativas:** se incorporan métricas de clúster, pods, APIs, RabbitMQ, Ingress y validaciones de boletos.
5. **Seguridad de información:** se refuerza el uso obligatorio de `.env`, GitHub Secrets y Kubernetes Secrets para evitar subir información sensible al repositorio.
6. **Persistencia de prácticas anteriores:** se mantiene todo lo implementado en usuarios, cartelera, reservas, pagos, CSV, paginación, boletos, control de accesos, K3s y CI/CD.
