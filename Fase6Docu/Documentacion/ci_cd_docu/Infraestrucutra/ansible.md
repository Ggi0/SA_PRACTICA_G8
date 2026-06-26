# Documentación de Automatización con Ansible

# 1. Introducción

La automatización de infraestructura constituye uno de los pilares fundamentales dentro de las prácticas modernas de **DevOps**, ya que permite administrar servidores, servicios y aplicaciones de forma consistente, reproducible y escalable. En lugar de realizar configuraciones manuales sobre cada máquina, las herramientas de automatización permiten definir el estado deseado de la infraestructura mediante archivos de configuración, los cuales pueden ser versionados, auditados y ejecutados tantas veces como sea necesario.

En el proyecto **FilmStars**, la automatización se implementa mediante la integración de **Terraform** y **Ansible** dentro de un pipeline de Integración y Despliegue Continuo (CI/CD). Mientras Terraform es responsable del aprovisionamiento de la infraestructura en Amazon Web Services (AWS), Ansible se encarga de instalar y configurar todos los componentes de software necesarios para que la plataforma pueda operar correctamente.

Una vez creadas las instancias EC2, las redes, los grupos de seguridad y el resto de la infraestructura mediante Terraform, Ansible establece conexiones seguras por medio del protocolo SSH hacia cada servidor y ejecuta las tareas de configuración correspondientes. Estas tareas incluyen la instalación de Docker, la preparación del entorno de desarrollo, la configuración del registro privado de imágenes, la instalación del clúster Kubernetes basado en K3s y el despliegue del sistema de observabilidad compuesto por Prometheus y Grafana.

Este enfoque proporciona múltiples beneficios durante el desarrollo del proyecto. En primer lugar, elimina la necesidad de configurar manualmente cada servidor, reduciendo significativamente el tiempo requerido para desplegar nuevos entornos. Además, garantiza que todas las máquinas sean configuradas exactamente de la misma forma, evitando diferencias entre ambientes de desarrollo, pruebas y producción. Finalmente, al mantener toda la configuración almacenada como código dentro del repositorio, cualquier cambio puede ser revisado, versionado y reproducido en cualquier momento.

La automatización implementada permite que, después de realizar un cambio en el repositorio y ejecutar el pipeline de GitHub Actions, toda la infraestructura quede completamente configurada sin intervención manual. Este flujo incrementa la confiabilidad del despliegue y facilita el mantenimiento de la arquitectura a largo plazo.

---

# 2. ¿Qué es Ansible?

Ansible es una herramienta de automatización de infraestructura de código abierto desarrollada para administrar servidores, desplegar aplicaciones y configurar servicios mediante un enfoque declarativo conocido como **Infrastructure as Code (IaC)** o **Configuration as Code (CaC)**. Su principal objetivo es permitir que la configuración de un sistema pueda describirse mediante archivos de texto en formato YAML, eliminando la necesidad de ejecutar comandos manualmente sobre cada servidor.

A diferencia de otras herramientas de automatización que requieren la instalación de agentes en cada máquina administrada, Ansible utiliza un modelo denominado **Agentless**, en el cual únicamente necesita conectarse mediante SSH para ejecutar las tareas definidas en los playbooks. Esto simplifica considerablemente la administración de la infraestructura, ya que reduce la cantidad de software que debe mantenerse instalado en los servidores.

El funcionamiento de Ansible se basa en la definición del estado deseado del sistema. En lugar de indicar paso por paso cómo realizar una instalación, el administrador especifica el resultado esperado, por ejemplo, que Docker debe encontrarse instalado, que un servicio debe permanecer activo o que un archivo de configuración debe existir con determinado contenido. Posteriormente, Ansible analiza el estado actual del servidor y ejecuta únicamente las acciones necesarias para alcanzar dicho estado.

En el proyecto FilmStars, Ansible constituye la segunda etapa del proceso de automatización. Una vez que Terraform finaliza la creación de la infraestructura en AWS, el pipeline genera automáticamente un inventario con las direcciones IP de las instancias EC2 y posteriormente ejecuta los playbooks de Ansible para realizar toda la configuración del entorno.

Las principales responsabilidades de Ansible dentro del proyecto incluyen:

* Configurar todas las instancias EC2 creadas por Terraform.
* Instalar Docker y Docker Compose en los servidores que lo requieren.
* Configurar el registro privado de imágenes utilizando Zot.
* Preparar el servidor destinado al entorno de desarrollo.
* Instalar y configurar el clúster Kubernetes basado en K3s.
* Instalar Node Exporter para la recolección de métricas de los servidores.
* Desplegar el stack de observabilidad compuesto por Prometheus y Grafana.

Gracias a esta automatización, cualquier entorno puede recrearse desde cero ejecutando nuevamente el pipeline, garantizando que la configuración aplicada sea siempre la misma independientemente del momento o del servidor donde se despliegue.

---

# 3. Marco Teórico

## 3.1 Automatización de infraestructura

La automatización de infraestructura consiste en reemplazar procedimientos manuales de configuración por procesos completamente automatizados definidos mediante código. Este enfoque permite que los servidores sean configurados de forma consistente, reduciendo errores humanos y facilitando la administración de sistemas distribuidos.

Tradicionalmente, la instalación de software implicaba acceder manualmente a cada servidor mediante SSH para ejecutar comandos de instalación, copiar archivos de configuración y habilitar servicios. Este procedimiento resultaba difícil de mantener cuando la cantidad de servidores aumentaba, además de generar diferencias entre ambientes debido a errores humanos.

Ansible elimina esta problemática al permitir que toda la configuración sea descrita mediante archivos YAML. De esta manera, la infraestructura deja de depender de procedimientos manuales y pasa a administrarse mediante código versionado.

---

## 3.2 Modelo Agentless

Uno de los aspectos más importantes de Ansible es su arquitectura **Agentless**. A diferencia de otras plataformas de automatización, Ansible no requiere instalar un agente permanente en cada servidor administrado.

El único requisito consiste en que el servidor remoto permita conexiones mediante SSH y disponga de Python instalado, ya que los módulos de Ansible son ejecutados temporalmente durante la conexión.

Durante la ejecución del pipeline, GitHub Actions actúa como nodo de control. Desde este servidor se establece una conexión SSH con cada una de las instancias EC2 creadas por Terraform y se ejecutan los playbooks correspondientes.

Este modelo simplifica considerablemente la administración de la infraestructura, disminuye el consumo de recursos en los servidores y reduce la superficie de mantenimiento al eliminar la necesidad de actualizar agentes distribuidos.

---

## 3.3 Modelo Declarativo

Ansible utiliza un enfoque declarativo para describir el estado esperado de un sistema.

En lugar de indicar una secuencia exacta de comandos que deben ejecutarse, el administrador únicamente especifica cuál debe ser el resultado final. Por ejemplo, puede indicarse que un determinado paquete debe estar instalado, que un servicio debe encontrarse habilitado o que un archivo debe contener determinada configuración.

Durante la ejecución del playbook, Ansible analiza el estado actual del sistema y determina automáticamente cuáles acciones son necesarias para alcanzar el estado deseado.

Este enfoque facilita el mantenimiento de la infraestructura, ya que las tareas son más fáciles de comprender y no dependen del estado previo del servidor.

---

## 3.4 Idempotencia

Una de las características más importantes de Ansible es la **idempotencia**, propiedad que garantiza que un mismo playbook pueda ejecutarse repetidas veces sin producir efectos secundarios no deseados.

Cuando una tarea ya fue aplicada previamente y el sistema ya cumple con el estado especificado, Ansible simplemente omite dicha operación.

Por ejemplo, si Docker ya se encuentra instalado en el servidor, el módulo encargado de instalar paquetes detectará esta condición y finalizará la tarea sin realizar modificaciones adicionales. Del mismo modo, si un servicio ya está iniciado y habilitado, no será reiniciado innecesariamente.

Gracias a esta característica, el pipeline de despliegue puede ejecutarse múltiples veces sin afectar la estabilidad del sistema, permitiendo corregir configuraciones o agregar nuevos componentes sin alterar los existentes.

---

## 3.5 Inventario

El inventario representa la lista de servidores que serán administrados por Ansible.

Cada host es organizado dentro de grupos lógicos que permiten ejecutar tareas específicas únicamente sobre determinados conjuntos de máquinas.

En el proyecto FilmStars el inventario no se mantiene de forma manual. Después de crear la infraestructura, Terraform genera automáticamente un archivo denominado `inventory.ini`, el cual contiene las direcciones IP públicas y privadas de cada instancia EC2.

Esta integración evita inconsistencias entre la infraestructura creada y la configuración aplicada posteriormente por Ansible.

---

## 3.6 Playbooks

Los playbooks constituyen la unidad principal de trabajo dentro de Ansible.

Un playbook es un archivo escrito en formato YAML que contiene una secuencia ordenada de tareas destinadas a configurar uno o varios servidores.

Cada tarea describe una acción específica, como instalar paquetes, copiar archivos, crear usuarios, iniciar servicios o ejecutar comandos.

Durante el proyecto, cada componente de la arquitectura dispone de su propio playbook independiente. Esta organización modular facilita el mantenimiento del código, permite reutilizar configuraciones y simplifica futuras ampliaciones de la infraestructura.

---

## 3.7 Módulos

Los módulos representan las unidades funcionales que ejecutan las acciones definidas dentro de cada tarea.

Ansible incorpora cientos de módulos especializados para administrar diferentes componentes del sistema operativo y de diversas plataformas tecnológicas.

Entre los módulos utilizados durante este proyecto destacan:

* `apt`, para instalar y actualizar paquetes en distribuciones basadas en Debian.
* `copy`, para copiar archivos desde el nodo de control hacia los servidores remotos.
* `template`, para generar archivos dinámicos a partir de plantillas.
* `systemd`, para administrar servicios del sistema operativo.
* `docker_container`, para desplegar y administrar contenedores Docker.
* `file`, para crear directorios, modificar permisos y administrar archivos.

El uso de módulos especializados evita depender de comandos de consola específicos, haciendo que los playbooks sean más legibles y portables.

---

## 3.8 Variables

Las variables permiten parametrizar la configuración del proyecto evitando la repetición de información.

En lugar de escribir varias veces una dirección IP, una contraseña o un nombre de usuario, dichos valores son almacenados dentro del directorio `group_vars`.

Durante la ejecución del pipeline, GitHub Actions genera automáticamente el archivo `group_vars/all.yml` utilizando los secretos almacenados en GitHub, evitando que información sensible quede expuesta dentro del repositorio.

Este mecanismo mejora la seguridad de la solución y facilita modificar configuraciones sin alterar directamente los playbooks.

---

# 4. Estructura del Proyecto

La organización de los archivos de Ansible sigue una estructura modular que facilita la administración de la infraestructura y permite separar claramente la configuración correspondiente a cada componente del proyecto. Cada directorio posee una responsabilidad específica y contribuye a mantener un código ordenado, reutilizable y fácil de mantener.

```text
infra/
└── ansible/
    ├── ansible.cfg
    ├── inventory.ini
    ├── group_vars/
    │   └── all.yml
    ├── playbooks/
    │   ├── common.yml
    │   ├── registry.yml
    │   ├── develop.yml
    │   ├── k3s.yml
    │   ├── monitoring.yml
    │   └── artifacts/
    │       └── k3s-kubeconfig.yaml
    └── site.yml
```

![](../../4+1/Diagramas_despliegue/componentes2.png)


El archivo `ansible.cfg` contiene la configuración global utilizada por Ansible durante la ejecución de los playbooks. En este archivo se define el inventario predeterminado, el usuario remoto utilizado para establecer las conexiones SSH, la ubicación de la llave privada y diversos parámetros relacionados con la comunicación entre el nodo de control y los servidores administrados.

El archivo `inventory.ini` corresponde al inventario de hosts. A diferencia de implementaciones tradicionales, este archivo no se mantiene manualmente, sino que es generado automáticamente por Terraform una vez finaliza el aprovisionamiento de la infraestructura. Gracias a ello, Ansible siempre dispone de la información actualizada sobre las direcciones IP de las instancias EC2.

El directorio `group_vars` almacena las variables compartidas por todos los playbooks. En él se incluyen parámetros como credenciales del registro privado, direcciones IP internas, versiones de software y demás configuraciones reutilizadas durante el despliegue.

Dentro del directorio `playbooks` se encuentran los archivos responsables de configurar cada componente de la arquitectura. Cada playbook posee una única responsabilidad, permitiendo mantener una separación clara entre las distintas fases de configuración del sistema.

Finalmente, el archivo `site.yml` actúa como punto de entrada de toda la automatización. Su única función consiste en importar y ejecutar secuencialmente todos los playbooks que conforman el proceso completo de configuración de la infraestructura.

---

# 5. Configuración Paso a Paso

Una vez creada la infraestructura mediante Terraform, el pipeline de integración continua inicia la fase de configuración utilizando Ansible. Durante esta etapa, cada servidor recibe automáticamente las configuraciones necesarias para cumplir la función que desempeñará dentro de la arquitectura del proyecto.

## 5.1 Prerrequisitos

Antes de ejecutar cualquier playbook es necesario verificar que el entorno cumpla una serie de requisitos mínimos. El nodo de control debe disponer de Ansible instalado y contar con conectividad hacia todas las instancias EC2 mediante el protocolo SSH.

Asimismo, la llave privada utilizada para autenticarse en los servidores debe encontrarse disponible dentro del runner de GitHub Actions. Esta llave es la misma que Terraform utiliza durante la creación de las instancias, permitiendo que ambas herramientas trabajen de manera integrada.

Finalmente, Terraform debe haber generado correctamente el archivo `inventory.ini`, ya que este contiene la información necesaria para identificar cada uno de los servidores que serán administrados.

## 5.2 Configuración de Ansible

La configuración general de Ansible se encuentra centralizada en el archivo `ansible.cfg`.

En este archivo se define el inventario predeterminado que utilizará la herramienta, el usuario remoto con el que se establecerán las conexiones SSH, la llave privada empleada para la autenticación y diferentes parámetros destinados a optimizar la comunicación entre el nodo de control y los servidores remotos.

Centralizar esta configuración evita repetir parámetros durante cada ejecución del pipeline y garantiza que todos los playbooks utilicen exactamente la misma configuración de conexión.

## 5.3 Generación del inventario dinámico

Una vez finalizado el aprovisionamiento de la infraestructura, Terraform exporta automáticamente las direcciones IP públicas y privadas de cada instancia EC2 mediante un comando `terraform output`.

Esta información se redirecciona hacia el archivo `inventory.ini`, permitiendo que Ansible conozca automáticamente los servidores que deberá administrar sin necesidad de modificar manualmente el inventario después de cada despliegue.

Este mecanismo constituye uno de los principales puntos de integración entre Terraform y Ansible dentro del proyecto.

## 5.4 Variables globales

Posteriormente, el pipeline genera el archivo `group_vars/all.yml`, el cual contiene todas las variables globales utilizadas durante la configuración de la infraestructura.

Entre estas variables se incluyen credenciales del registro privado Zot, direcciones IP internas, direcciones públicas y versiones específicas de los diferentes componentes instalados.

La generación automática de este archivo permite utilizar los secretos almacenados en GitHub Actions sin exponer información confidencial dentro del repositorio.

## 5.5 Ejecución del playbook principal

El archivo `site.yml` constituye el punto de entrada de toda la automatización.

En lugar de contener tareas directamente, este archivo importa secuencialmente los distintos playbooks especializados que conforman el proyecto. Gracias a esta organización modular, cada componente puede evolucionar de forma independiente sin afectar el resto de la infraestructura.

Cuando el pipeline ejecuta `ansible-playbook site.yml`, Ansible procesa automáticamente cada playbook respetando el orden definido, garantizando que las dependencias entre componentes sean satisfechas correctamente.

En las siguientes secciones del manual se describirá detalladamente el funcionamiento interno de cada uno de estos playbooks y las tareas específicas que ejecutan durante el despliegue de la infraestructura.
