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
| RF-40  | Frontend / API Gateway                     | Alta      | El sistema debe permitir el acceso a un panel de administración únicamente a usuarios autenticados con rol `Admin`.                    |
| RF-41  | Frontend                                   | Alta      | El sistema debe ocultar o restringir las vistas administrativas a usuarios que no posean rol `Admin`.                                  |
| RF-42  | API Gateway / Backend SOA                  | Alta      | El sistema debe validar en cada endpoint administrativo que el JWT pertenezca a un usuario con rol `Admin`.                            |
| RF-43  | API Gateway / Backend SOA                  | Alta      | El sistema debe denegar el acceso a endpoints administrativos cuando el usuario no esté autenticado o no tenga rol `Admin`.            |
| RF-44  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador crear nuevos cines                                                         |
| RF-45  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador consultar cines registrados.                                                   |
| RF-46  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador actualizar la información de un cine existente.                                              |
| RF-47  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador eliminar o desactivar cines registrados.                                                     |
| RF-48  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador crear salas asociadas a un cine.                                                             |
| RF-49  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador consultar las salas registradas por cine.                                                    |
| RF-50  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador actualizar la información de una sala existente.                                             |
| RF-51  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador eliminar o desactivar salas registradas.                                                     |
| RF-52  | Servicio de Películas/Cartelera / Reservas | Alta      | El sistema debe permitir configurar el mapa base de asientos de una sala.                                                              |
| RF-53  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador asignar películas a salas específicas.                                                       |
| RF-54  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador crear horarios y funciones para una película.                                                |
| RF-55  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador actualizar horarios y funciones existentes.                                                  |
| RF-56  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir al administrador eliminar, cancelar o desactivar funciones programadas.                                       |
| RF-57  | Servicio de Películas/Cartelera            | Alta      | El sistema debe validar que no existan dos funciones en la misma sala y horario.                                             |
| RF-58  | Servicio de Películas/Cartelera            | Alta      | El sistema debe permitir definir si una función corresponde a Estreno, Pre-venta o Re-estreno.                                         |
| RF-59  | Servicio de Reservas/Asientos              | Alta      | El sistema debe generar o actualizar la disponibilidad de asientos de una función con base en el mapa de asientos de la sala asignada. |


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
| RNF-25 | Seguridad | Alta      | Las rutas administrativas deben protegerse mediante control de acceso basado en roles.                                                                                         |
| RNF-26 | Seguridad | Alta      | El JWT debe incluir los claims necesarios para validar identidad y rol del usuario, especialmente el rol `Admin`.                                                              |
| RNF-27 | Seguridad | Alta      | La validación de rol administrador debe aplicarse tanto en frontend como en backend, evitando acceso directo a vistas o APIs administrativas.                                  |
| RNF-28 | Calidad | Alta      | El backend debe contar con pruebas unitarias automatizadas para validar lógica de negocio crítica.                                                                             |
| RNF-29 | Cobertura | Alta      | Las pruebas unitarias deben alcanzar como mínimo un 75% de cobertura en los componentes principales del backend.                                                               |
| RNF-30 | Calidad | Alta      | El pipeline debe ejecutar automáticamente la instalación de dependencias, compilación y pruebas unitarias.                                                                     |
| RNF-31 | Control de calidad   | Alta      | El pipeline debe detenerse si alguna prueba falla o si la cobertura es menor al 75%.                                                                                           |
| RNF-32 | CI/CD | Alta      | El proyecto debe contar con un pipeline de CI/CD, preferiblemente mediante GitHub Actions.                                                                                     |
| RNF-33 | Monitoreo | Media     | El sistema debe generar reportes o logs legibles de ejecución de pruebas y cobertura.                                                                                          |
| RNF-34 | DevOps  | Alta      | Cada componente independiente debe contar con su Dockerfile correspondiente.                                                                                                   |
| RNF-35 | Docker Compose  | Alta      | El archivo `docker-compose.yml` debe permitir replicar el entorno completo de manera local con un solo comando.                                                                |
| RNF-36 | Despliegue | Alta      | El proyecto debe documentar el flujo de despliegue desde GitHub hacia el entorno definido por el equipo.                                                                       |
| RNF-37 | Trazabilidad | Media     | La documentación debe incluir el flujo desde commit, Pull Request, ejecución del pipeline, pruebas y despliegue.                                                               |
