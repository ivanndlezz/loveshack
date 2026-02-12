# Modelo de Precios - Loveshack Reservations

## Configuración Regular

| Parámetro             | Valor    |
| --------------------- | -------- |
| Tarifa por hora       | $600 MXN |
| Duración mínima       | 2 horas  |
| Pasajeros incluidos   | 14       |
| Tarifa extra pasajero | $100 MXN |

### Ejemplo de cálculo - Regular

**Reservación:** 4 horas, 16 pasajeros

| Concepto        | Cálculo      | Total      |
| --------------- | ------------ | ---------- |
| Tarifa base     | 4 hrs × $600 | $2,400     |
| Pasajeros extra | 2 × $100     | $200       |
| **Subtotal**    |              | **$2,600** |

---

## Caso Get My Boat

Get My Boat tiene una lógica especial:

| Parámetro             | Valor                            |
| --------------------- | -------------------------------- |
| Tarifa por hora       | $500 MXN ($600 - $100 descuento) |
| Duración mínima       | 2 horas                          |
| Pasajeros incluidos   | 14                               |
| Tarifa extra pasajero | $100 MXN                         |
| Comisión plataforma   | 11.5%                            |

### Ejemplo de cálculo - Get My Boat

**Reservación:** 4 horas, 16 pasajeros

| Concepto             | Cálculo                       | Total      |
| -------------------- | ----------------------------- | ---------- |
| Tarifa base          | 4 hrs × $500                  | $2,000     |
| Pasajeros extra      | 2 × $100                      | $200       |
| **Subtotal negocio** |                               | **$2,200** |
| Comisión 11.5%       | $2,200 ÷ (1 - 0.115) = $2,485 | $285       |
| **Precio cliente**   |                               | **$2,485** |

### Cómo funciona la comisión

Cuando una plataforma cobra comisión (fee), el precio que paga el cliente es mayor que lo que recibe el negocio.

**Fórmula:**

```
Precio Cliente = Precio Negocio ÷ (1 - % Comisión)
Comisión = Precio Cliente - Precio Negocio
```

**Para Get My Boat (11.5%):**

- Negocio recibe: $2,200
- Cliente paga: $2,200 ÷ 0.885 = $2,485
- Comisión: $285 (11.5% del precio cliente)

---

## Comparación Directa

| Concepto      | Regular | Get My Boat |
| ------------- | ------- | ----------- |
| Tarifa/hora   | $600    | $500        |
| Comisión      | 0%      | 11.5%       |
| 4 hrs, 14 pax | $2,400  | $2,000      |
| 4 hrs, 16 pax | $2,600  | $2,485      |
| Cliente paga  | $2,600  | $2,485      |

**Nota:** A pesar de la tarifa más baja en Get My Boat, el precio al cliente termina siendo muy similar porque no hay comisión en el precio regular.
