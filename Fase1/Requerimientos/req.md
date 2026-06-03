

# /Requerimientos
## /Requerimientos Funcionales (RF)

## Requerimientos Funcionales

| Código | Servicio Asociado               | Requerimiento                                                                                                                                           |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-01  | Servicio de Usuario             | El sistema debe permitir la gestión de usuarios.                                                                                                        |
| RF-02  | Servicio de Usuario             | El sistema debe permitir identificar al usuario que realiza la compra del boleto.                                                                       |
| RF-03  | Servicio de Usuario             | El sistema debe permitir consultar la información del usuario cuando se asocia una reserva o compra.                                                    |
| RF-04  | Servicio de Películas/Cartelera | El sistema debe permitir seleccionar una ubicación.                                                                                                     |
| RF-05  | Servicio de Películas/Cartelera | El sistema debe mostrar las funciones disponibles según el cine seleccionado.                                                                           |
| RF-06  | Servicio de Películas/Cartelera | El sistema debe permitir al usuario consultar la cartelera de películas.                                                                                |
| RF-07  | Servicio de Películas/Cartelera | El sistema debe clasificar las películas por categoría: estrenos, pre-ventas y re-estrenos.                                                             |
| RF-08  | Servicio de Películas/Cartelera | El sistema debe permitir al usuario visualizar las películas clasificadas como estrenos.                                                                |
| RF-09  | Servicio de Películas/Cartelera | El sistema debe permitir visualizar las películas clasificadas como reestrenos.                                                                         |
| RF-10  | Servicio de Películas/Cartelera | El sistema debe permitir seleccionar una función específica de una película.                                                                            |
| RF-11  | Servicio de Películas/Cartelera | El sistema debe mostrar los cines disponibles según la ubicación seleccionada.                                                                          |
| RF-12  | Servicio de Películas/Cartelera | El sistema debe mostrar los horarios disponibles para cada función.                                                                                     |
| RF-13  | Servicio de Películas/Cartelera | El sistema debe permitir visualizar las películas clasificadas como pre-ventas.                                                                         |
| RF-14  | Servicio de Películas/Cartelera | El sistema debe permitir seleccionar una película de la cartelera.                                                                                      |
| RF-15  | Servicio de Reservas/Asientos   | El sistema debe mostrar el mapa interactivo de la sala que corresponde a la función seleccionada.                                                       |
| RF-16  | Servicio de Reservas/Asientos   | El sistema debe permitir seleccionar uno o varios asientos, siempre que estos estén disponibles.                                                        |
| RF-17  | Servicio de Reservas/Asientos   | El sistema debe validar la disponibilidad real de los asientos antes de confirmar la reserva.                                                           |
| RF-18  | Servicio de Reservas/Asientos   | El sistema debe rechazar la reserva cuando uno o más asientos ya no estén disponibles.                                                                  |
| RF-19  | Servicio de Reservas/Asientos   | El sistema debe evitar que dos usuarios puedan confirmar la compra del mismo asiento cuando seleccionan la misma función.                               |
| RF-20  | Servicio de Reservas/Asientos   | El sistema debe mostrar el estado de cada asiento de manera visual.                                                                                     |
| RF-21  | Servicio de Reservas/Asientos   | El sistema debe bloquear temporalmente los asientos seleccionados durante el proceso de compra para evitar que sean seleccionados por otro usuario.     |
| RF-22  | Servicio de Reservas/Asientos   | El sistema debe enviar la solicitud de reserva de asientos a una cola de mensajería para su procesamiento.                                              |
| RF-23  | Servicio de Reservas/Asientos   | El sistema debe confirmar la reserva cuando los asientos seleccionados estén disponibles.                                                               |
| RF-24  | Servicio de Reservas/Asientos   | El sistema debe liberar automáticamente los asientos bloqueados cuando el tiempo de reserva temporal haya vencido o cuando no se proceda con la compra. |
| RF-25  | Servicio de Pagos               | El sistema debe permitir procesar un pago simulado para una reserva confirmada.                                                                         |
| RF-26  | Servicio de Pagos               | El sistema debe registrar la transacción de pago realizada.                                                                                             |
| RF-27  | Servicio de Pagos               | El sistema debe confirmar la compra cuando el pago sea exitoso.                                                                                         |
| RF-28  | Servicio de Pagos               | El sistema debe emitir el boleto final cuando la compra haya sido exitosa.                                                                              |
| RF-29  | Servicio de Pagos               | El sistema debe validar el resultado del pago simulado.                                                                                                 |
| RF-30  | Servicio de Pagos               | El sistema debe asociar la transacción registrada a la reserva.                                                                                         |
| RF-31  | Servicio de Pagos               | El sistema debe rechazar o cancelar la compra cuando el pago no haya sido satisfactorio.                                                                |
| RF-32  | Servicio de Pagos               | El sistema debe permitir realizar una consulta del estado de la reservación: aprobada, rechazada o pendiente.                                           |



## /Requerimientos NO Funcionales (RNF)

## Requerimientos No Funcionales

| Código | Categoría              | Requerimiento                                                                                                                                                    |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquitectura           | El sistema se implementará con un enfoque de Arquitectura Orientada a Servicios de la siguiente forma: Usuarios, Películas/Cartelera, Reservas/Asientos y Pagos. |
| RNF-02 | Modularidad            | Cada servicio se trabajará como un modelo de servicio independiente.                                                                                             |
| RNF-03 | Comunicación Asíncrona | La comunicación crítica entre servicios debe realizarse de forma asíncrona mediante colas de mensajería.                                                         |
| RNF-04 | Middleware             | El sistema utilizará un middleware de mensajería basado en colas, específicamente RabbitMQ.                                                                      |
| RNF-05 | No bloqueo             | Las peticiones críticas no deben bloquear el hilo principal de la aplicación; deben ingresar a una cola para ser procesadas por consumidores independientes.     |
| RNF-06 | Concurrencia           | El sistema debe impedir que ocurran conflictos de concurrencia cuando varios usuarios seleccionen asientos al mismo tiempo.                                      |
| RNF-07 | Integridad             | El sistema debe garantizar que las operaciones financieras no se pierdan en caso de fallos parciales o caídas del sistema.                                       |
| RNF-08 | Consistencia           | El sistema debe asegurar que un mismo asiento no pueda ser asignado a más de un usuario en la misma función.                                                     |
| RNF-09 | Alta demanda           | El sistema debe estar preparado para manejar picos elevados de actividad durante la consulta de cartelera, la selección de asientos y la compra de boletos.      |
| RNF-10 | Rendimiento            | Las consultas de cartelera, cines y funciones deben responder en un máximo de dos segundos bajo condiciones normales.                                            |
| RNF-11 | Rendimiento            | El mapa de asientos debe mostrar resultados en un tiempo aproximado de dos segundos bajo carga estándar.                                                         |
| RNF-12 | Tolerancia a fallos    | Si el servicio de pago o reserva presenta una falla temporal, los mensajes deben mantenerse en cola o poder reprocesarse sin perder la solicitud.                |
| RNF-13 | Seguridad              | El sistema debe proteger la información del usuario y las transacciones mediante autenticación o control de sesión.                                              |
| RNF-14 | Seguridad              | Solo usuarios o procesos autorizados pueden ejecutar operaciones sensibles como confirmar reservas o procesar pagos.                                             |
| RNF-15 | Mantenibilidad         | El código debe estructurarse por servicios o módulos con responsabilidades claramente definidas.                                                                 |
| RNF-16 | Contenedores           | Las modificaciones y servicios deben ejecutarse dentro de contenedores para facilitar su despliegue y administración.                                            |
| RNF-17 | Interoperabilidad      | Los servicios deben ofrecer interfaces de comunicación claras mediante mensajería asíncrona.                                                                     |
