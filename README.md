# SA_PRACTICA_G8

## Integrantes

| Grupo | Carné | Nombre |
| ----- | ----- | ------ |
| 8 | 202100229 | Giovanni Saul Concohá Cax |
| 8 | 202200214 | Pablo Alejandro Marroquin Cutz |
| 8 | 201602619 | María de los Angeles Paz de León |
| 8 | 202180003 | Angel Isaias Mendoza Martinez |
| 8 | 202001814 | Naomi Rashel Yos Cujcuj |

## Índice

1. [Introducción](#introducción)
2. [Desarrollo](#desarrollo)
3. [Requerimientos del sistema](#requerimientos-del-sistema)
4. [Modelo de casos de uso](#modelo-de-casos-de-uso)
5. [Vista de arquitectura 4+1](#vista-de-arquitectura-41)
6. [Diagramas estructurales, comportamiento y persistencia](#diagramas-estructurales-comportamiento-y-persistencia)
7. [Conclusiones](#conclusiones)

## Introducción

FilmStars es una plataforma web orientada a la venta de boletos de cine en línea. El sistema permite consultar cartelera por ubicación, visualizar funciones disponibles, seleccionar asientos en tiempo real, procesar pagos simulados y emitir boletos digitales.

La solución se plantea bajo un enfoque de Arquitectura Orientada a Servicios (SOA), separando los dominios principales del negocio en servicios independientes: usuarios, cartelera, reservas/asientos y pagos. Además, los procesos críticos de concurrencia y transacciones financieras se modelan con comunicación asíncrona mediante un bróker de mensajería, con el objetivo de evitar condiciones de carrera y pérdida de transacciones.

## Desarrollo

La documentación de la práctica se encuentra organizada dentro de la carpeta `Fase1`, separando los entregables requeridos por el enunciado: requerimientos, casos de uso, vistas de arquitectura y diagramas técnicos.

## Requerimientos del sistema

- [Requerimientos funcionales y no funcionales](Fase1/Requerimientos/req.md)

## Modelo de casos de uso

- [Diagramas y casos de uso expandidos](Fase1/CasosDeUso/DCU.md)
- [Links de diagramas de casos de uso](Fase1/CasosDeUso/linksdiagramas.md)

## Vista de arquitectura 4+1

- [Vista de arquitectura 4+1](Fase1/4+1/vista.md)
- [Links de vistas arquitectónicas](Fase1/4+1/LinksVistas.md)

## Diagramas estructurales, comportamiento y persistencia

- [Diagrama de arquitectura general](Fase1/Diagramas/diagrama_general.md)
- [Diagrama de componentes](Fase1/Diagramas/diagrama_componentes.md)
- [Diagrama de actividades](Fase1/Diagramas/diagrama_actividad.md)
- [Diagrama de secuencia](Fase1/Diagramas/diagrama_secuencia.md)
- [Diagrama entidad-relación](Fase1/Diagramas/diagramas_entidadrelacion.md)
- [URL del diagrama entidad-relación](Fase1/Diagramas/URLEntidadRelacion.md)

## Conclusiones

- La arquitectura SOA permite separar responsabilidades por dominio, facilitando el mantenimiento, la escalabilidad y la evolución independiente de los servicios.
- El uso de comunicación asíncrona mediante colas es fundamental para manejar la concurrencia en la selección de asientos y reducir el riesgo de pérdida de transacciones durante el proceso de pago.
- La documentación mediante casos de uso, vistas arquitectónicas y diagramas técnicos permite representar de forma clara tanto el comportamiento funcional como la estructura interna del sistema.
- El sistema propuesto cubre el flujo principal de negocio de una cadena de cines: búsqueda de funciones, selección de asientos, reserva temporal, procesamiento de pago y emisión del boleto final.
