<template>
  <Teleport to="body">
    <div v-if="visible" class="split-backdrop" @mousedown.self="cerrar">
      <section
        ref="dialogo"
        class="split-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="split-title"
        tabindex="-1"
        @keydown.esc="cerrar"
      >
        <header class="split-header">
          <div>
            <p class="split-eyebrow">Opciones de pago</p>
            <h2 id="split-title">Dividir cuenta</h2>
            <p>Asigna el monto, método y comprobante de cada pago.</p>
          </div>
          <button type="button" class="btn-close" aria-label="Cerrar" @click="cerrar"></button>
        </header>

        <div class="split-total">
          <span>Total de la cuenta</span>
          <strong>S/ {{ moneda(total) }}</strong>
        </div>

        <div class="split-tabs" role="tablist" aria-label="Forma de división">
          <button
            type="button"
            role="tab"
            :aria-selected="modo === 'iguales'"
            :class="{ active: modo === 'iguales' }"
            @click="cambiarModo('iguales')"
          >
            En partes iguales
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="modo === 'personalizado'"
            :class="{ active: modo === 'personalizado' }"
            @click="cambiarModo('personalizado')"
          >
            Monto personalizado
          </button>
        </div>

        <div v-if="modo === 'iguales'" class="people-control">
          <span>Dividir cuenta entre</span>
          <div class="stepper" aria-label="Cantidad de personas">
            <button type="button" aria-label="Quitar persona" :disabled="cantidad <= 2" @click="cambiarCantidad(-1)">
              <i class="bi bi-dash"></i>
            </button>
            <strong>{{ cantidad }}</strong>
            <button type="button" aria-label="Añadir persona" :disabled="cantidad >= 10" @click="cambiarCantidad(1)">
              <i class="bi bi-plus"></i>
            </button>
          </div>
          <span>{{ cantidad === 1 ? 'persona' : 'personas' }}</span>
        </div>

        <div class="split-body">
          <article v-for="(pago, indice) in pagos" :key="pago.clave" class="payment-card">
            <div class="payment-card__header">
              <div class="person-label">
                <span><i class="bi bi-person"></i></span>
                <strong>Pago {{ indice + 1 }}</strong>
              </div>
              <button
                v-if="modo === 'personalizado' && pagos.length > 1"
                type="button"
                class="remove-payment"
                :aria-label="`Eliminar pago ${indice + 1}`"
                @click="eliminarPago(indice)"
              >
                <i class="bi bi-trash3"></i>
              </button>
            </div>

            <div class="payment-grid">
              <label>
                <span>Monto a pagar</span>
                <div class="input-money">
                  <span>S/</span>
                  <input
                    v-model="pago.monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputmode="decimal"
                    :readonly="modo === 'iguales'"
                    @input="normalizarEfectivo(pago)"
                  />
                </div>
              </label>

              <label>
                <span>Método</span>
                <select v-model="pago.metodoPago" @change="normalizarEfectivo(pago)">
                  <option v-for="metodo in metodos" :key="metodo.valor" :value="metodo.valor">
                    {{ metodo.etiqueta }}
                  </option>
                </select>
              </label>

              <label>
                <span>Comprobante</span>
                <select v-model="pago.tipoComprobante" @change="cambioComprobante(pago)">
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                </select>
              </label>
            </div>

            <div class="payment-grid payment-grid--secondary">
              <label v-if="pago.metodoPago === 'EFECTIVO'">
                <span>Monto recibido</span>
                <div class="input-money">
                  <span>S/</span>
                  <input v-model="pago.montoRecibido" type="number" min="0" step="0.01" inputmode="decimal" />
                </div>
                <small>Vuelto: S/ {{ moneda(vueltoPago(pago)) }}</small>
              </label>

              <label>
                <span>{{ pago.tipoComprobante === 'FACTURA' ? 'RUC' : 'DNI (opcional)' }}</span>
                <input
                  v-model.trim="pago.documentoCliente"
                  type="text"
                  inputmode="numeric"
                  :maxlength="pago.tipoComprobante === 'FACTURA' ? 11 : 8"
                  :placeholder="pago.tipoComprobante === 'FACTURA' ? '11 dígitos' : '8 dígitos'"
                  @input="soloDigitos(pago, 'documentoCliente')"
                />
              </label>

              <label v-if="pago.tipoComprobante === 'FACTURA'">
                <span>Razón social</span>
                <input v-model.trim="pago.razonSocial" type="text" maxlength="150" placeholder="Nombre o razón social" />
              </label>

              <label v-else-if="pago.metodoPago !== 'EFECTIVO'">
                <span>Referencia (opcional)</span>
                <input v-model.trim="pago.referencia" type="text" maxlength="80" placeholder="N.º de operación" />
              </label>
            </div>
          </article>

          <button
            v-if="modo === 'personalizado' && pagos.length < 20"
            type="button"
            class="add-payment"
            @click="agregarPago"
          >
            <i class="bi bi-plus-lg"></i>
            Añadir otro pago
          </button>
        </div>

        <div class="split-status" :class="estadoDivision.clase" aria-live="polite">
          <i :class="estadoDivision.icono"></i>
          <span>{{ estadoDivision.etiqueta }}</span>
        </div>

        <p v-if="error" class="split-error" role="alert">
          <i class="bi bi-exclamation-circle"></i>
          {{ error }}
        </p>

        <footer class="split-footer">
          <button type="button" class="btn btn-outline-secondary" @click="cerrar">Cancelar</button>
          <button type="button" class="btn btn-primary split-confirm" :disabled="!divisionCompleta" @click="confirmar">
            <i class="bi bi-check2-circle"></i>
            Usar {{ pagos.length }} {{ pagos.length === 1 ? 'pago' : 'pagos' }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  total: { type: Number, required: true },
  datosComprobante: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'confirm'])

const dialogo = ref(null)
const modo = ref('iguales')
const cantidad = ref(2)
const pagos = ref([])
const error = ref('')
let consecutivo = 0

const metodos = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'YAPE', etiqueta: 'Yape' },
  { valor: 'PLIN', etiqueta: 'Plin' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
]

const centavosTotal = computed(() => Math.round(Number(props.total || 0) * 100))
const centavosPagados = computed(() =>
  pagos.value.reduce((suma, pago) => suma + Math.round(Number(pago.monto || 0) * 100), 0),
)
const diferencia = computed(() => centavosTotal.value - centavosPagados.value)

const divisionCompleta = computed(() => diferencia.value === 0 && pagos.value.length > 1 && pagos.value.every(validarPago))

const estadoDivision = computed(() => {
  if (diferencia.value === 0) {
    return { clase: 'is-complete', icono: 'bi bi-check-circle-fill', etiqueta: 'Cuenta distribuida por completo' }
  }
  if (diferencia.value > 0) {
    return {
      clase: 'is-pending',
      icono: 'bi bi-info-circle-fill',
      etiqueta: `Restante por asignar: S/ ${moneda(diferencia.value / 100)}`,
    }
  }
  return {
    clase: 'is-error',
    icono: 'bi bi-exclamation-circle-fill',
    etiqueta: `Exceso asignado: S/ ${moneda(Math.abs(diferencia.value) / 100)}`,
  }
})

watch(
  () => props.visible,
  async (visible) => {
    document.body.classList.toggle('modal-open', visible)
    if (visible) {
      reiniciar()
      await nextTick()
      dialogo.value?.focus()
    }
  },
)

const nuevoPago = (monto = '0.00') => ({
  clave: ++consecutivo,
  monto,
  metodoPago: 'EFECTIVO',
  montoRecibido: monto,
  tipoComprobante: props.datosComprobante.tipoComprobante || 'BOLETA',
  documentoCliente: props.datosComprobante.documentoCliente || '',
  razonSocial: props.datosComprobante.razonSocial || '',
  referencia: '',
})

const reiniciar = () => {
  modo.value = 'iguales'
  cantidad.value = 2
  error.value = ''
  regenerarIguales()
}

const regenerarIguales = () => {
  const base = Math.floor(centavosTotal.value / cantidad.value)
  const residuo = centavosTotal.value % cantidad.value
  pagos.value = Array.from({ length: cantidad.value }, (_, indice) => {
    const monto = ((base + (indice < residuo ? 1 : 0)) / 100).toFixed(2)
    return nuevoPago(monto)
  })
}

const cambiarModo = (nuevoModo) => {
  if (modo.value === nuevoModo) return
  modo.value = nuevoModo
  error.value = ''
  if (nuevoModo === 'iguales') {
    regenerarIguales()
  } else {
    pagos.value = [nuevoPago((props.total / 2).toFixed(2)), nuevoPago((props.total - props.total / 2).toFixed(2))]
  }
}

const cambiarCantidad = (cambio) => {
  cantidad.value = Math.min(10, Math.max(2, cantidad.value + cambio))
  regenerarIguales()
}

const agregarPago = () => {
  const restante = Math.max(0, diferencia.value) / 100
  pagos.value.push(nuevoPago(restante.toFixed(2)))
}

const eliminarPago = (indice) => pagos.value.splice(indice, 1)

const normalizarEfectivo = (pago) => {
  if (pago.metodoPago === 'EFECTIVO' && Number(pago.montoRecibido || 0) < Number(pago.monto || 0)) {
    pago.montoRecibido = Number(pago.monto || 0).toFixed(2)
  }
}

const cambioComprobante = (pago) => {
  pago.documentoCliente = ''
  pago.razonSocial = ''
}

const soloDigitos = (pago, campo) => {
  pago[campo] = String(pago[campo] || '').replace(/\D/g, '')
}

const vueltoPago = (pago) =>
  pago.metodoPago === 'EFECTIVO'
    ? Math.max(0, Number(pago.montoRecibido || 0) - Number(pago.monto || 0))
    : 0

function validarPago(pago) {
  const monto = Number(pago.monto || 0)
  if (!Number.isFinite(monto) || monto <= 0) return false
  if (pago.metodoPago === 'EFECTIVO' && Number(pago.montoRecibido || 0) < monto) return false
  if (pago.tipoComprobante === 'FACTURA') {
    return /^\d{11}$/.test(pago.documentoCliente || '') && Boolean(pago.razonSocial?.trim())
  }
  return !pago.documentoCliente || /^\d{8}$/.test(pago.documentoCliente)
}

const mensajePagoInvalido = () => {
  const indice = pagos.value.findIndex((pago) => !validarPago(pago))
  if (indice === -1) return ''
  const pago = pagos.value[indice]
  if (Number(pago.monto || 0) <= 0) return `El pago ${indice + 1} necesita un monto mayor a cero.`
  if (pago.metodoPago === 'EFECTIVO' && Number(pago.montoRecibido || 0) < Number(pago.monto || 0)) {
    return `El monto recibido del pago ${indice + 1} es insuficiente.`
  }
  if (pago.tipoComprobante === 'FACTURA') return `Completa el RUC y la razón social del pago ${indice + 1}.`
  return `El DNI del pago ${indice + 1} debe tener 8 dígitos.`
}

const confirmar = () => {
  error.value = mensajePagoInvalido()
  if (!divisionCompleta.value) return
  emit(
    'confirm',
    pagos.value.map((pago) => ({
      monto: Number(pago.monto).toFixed(2),
      montoRecibido:
        pago.metodoPago === 'EFECTIVO' ? Number(pago.montoRecibido).toFixed(2) : Number(pago.monto).toFixed(2),
      metodoPago: pago.metodoPago,
      tipoComprobante: pago.tipoComprobante,
      documentoCliente: pago.documentoCliente || null,
      razonSocial: pago.tipoComprobante === 'FACTURA' ? pago.razonSocial : null,
      referencia: pago.referencia || null,
    })),
  )
}

const cerrar = () => emit('close')
const moneda = (valor) => Number(valor || 0).toFixed(2)
</script>

<style scoped>
.split-backdrop {
  align-items: center;
  background: rgba(34, 27, 24, 0.58);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 1080;
}

.split-dialog {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 80px rgba(41, 28, 21, 0.25);
  max-height: calc(100vh - 2rem);
  max-width: 820px;
  outline: none;
  overflow: auto;
  width: 100%;
}

.split-header,
.split-footer {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  padding: 1.35rem 1.5rem;
}

.split-header { border-bottom: 1px solid #eee7e2; }
.split-header h2 { color: #332b27; font-size: 1.35rem; font-weight: 750; margin: 0 0 0.25rem; }
.split-header p { color: #756b65; margin: 0; }
.split-eyebrow { color: #c6643b !important; font-size: 0.72rem; font-weight: 750; letter-spacing: 0.09em; text-transform: uppercase; }

.split-total {
  align-items: center;
  background: #fcf7f3;
  display: flex;
  justify-content: space-between;
  margin: 1rem 1.5rem;
  padding: 0.8rem 1rem;
  border-radius: 11px;
}
.split-total span { color: #71665f; font-size: 0.85rem; font-weight: 600; }
.split-total strong { color: #b95731; font-size: 1.3rem; }

.split-tabs { border-bottom: 1px solid #e9e1dc; display: flex; margin: 0 1.5rem; }
.split-tabs button { background: none; border: 0; border-bottom: 3px solid transparent; color: #786d67; flex: 1; font-weight: 650; padding: 0.75rem; }
.split-tabs button.active { border-color: #d56c3f; color: #b4512d; }

.people-control { align-items: center; display: flex; gap: 0.75rem; justify-content: center; padding: 1rem 1.5rem 0; color: #665c56; }
.stepper { border: 1px solid #ddcfc6; border-radius: 8px; display: flex; overflow: hidden; }
.stepper button { background: #fff; border: 0; color: #b45732; height: 34px; width: 36px; }
.stepper button:disabled { color: #cfc6c1; }
.stepper strong { align-items: center; border-left: 1px solid #e7ddd7; border-right: 1px solid #e7ddd7; display: flex; justify-content: center; min-width: 42px; }

.split-body { display: grid; gap: 0.8rem; padding: 1rem 1.5rem; }
.payment-card { border: 1px solid #eadfd8; border-radius: 12px; padding: 1rem; }
.payment-card__header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 0.85rem; }
.person-label { align-items: center; color: #413833; display: flex; gap: 0.55rem; }
.person-label > span { align-items: center; background: #f7e9e1; border-radius: 50%; color: #bd5d37; display: flex; height: 30px; justify-content: center; width: 30px; }
.remove-payment { background: transparent; border: 0; color: #b94b4b; }

.payment-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.payment-grid--secondary { margin-top: 0.75rem; }
.payment-grid label { min-width: 0; }
.payment-grid label > span { color: #625852; display: block; font-size: 0.76rem; font-weight: 700; margin-bottom: 0.3rem; }
.payment-grid input,
.payment-grid select { background: #fff; border: 1px solid #dcd3cd; border-radius: 8px; min-height: 40px; padding: 0.55rem 0.65rem; width: 100%; }
.payment-grid input:focus,
.payment-grid select:focus { border-color: #d16a3e; box-shadow: 0 0 0 3px rgba(209, 106, 62, 0.13); outline: none; }
.payment-grid input[readonly] { background: #f7f4f2; }
.payment-grid small { color: #6a8271; display: block; margin-top: 0.25rem; }
.input-money { align-items: center; display: flex; position: relative; }
.input-money > span { color: #81756e; font-weight: 650; left: 0.65rem; position: absolute; }
.input-money input { padding-left: 2rem; }

.add-payment { background: #fff; border: 1px dashed #ca9d88; border-radius: 9px; color: #ac502e; font-weight: 650; padding: 0.65rem; }
.split-status { align-items: center; border-radius: 9px; display: flex; font-weight: 650; gap: 0.5rem; margin: 0 1.5rem; padding: 0.7rem 0.85rem; }
.split-status.is-complete { background: #eaf7ef; color: #247947; }
.split-status.is-pending { background: #fff6df; color: #8b6717; }
.split-status.is-error { background: #fcebea; color: #a53c3c; }
.split-error { color: #a43d3d; font-size: 0.85rem; margin: 0.6rem 1.5rem 0; }
.split-footer { align-items: center; border-top: 1px solid #eee7e2; gap: 0.75rem; margin-top: 1rem; }
.split-footer .btn { min-width: 140px; }
.split-confirm { background: #c96038; border-color: #c96038; margin-left: auto; }
.split-confirm:hover { background: #ae4e2b; border-color: #ae4e2b; }

@media (max-width: 700px) {
  .split-backdrop { align-items: flex-end; padding: 0; }
  .split-dialog { border-radius: 18px 18px 0 0; max-height: 94vh; }
  .payment-grid { grid-template-columns: 1fr; }
  .split-header, .split-footer { padding: 1rem; }
  .split-body { padding: 1rem; }
  .split-tabs, .split-status { margin-left: 1rem; margin-right: 1rem; }
  .split-total { margin-left: 1rem; margin-right: 1rem; }
  .split-footer .btn { flex: 1; min-width: 0; }
}
</style>
