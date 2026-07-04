<template>
    <div class="layout">
        <SidebarComponent />

        <div class="main-content">
            <NavbarComponent />

            <main class="p-4 p-md-5">
                    <h2 class="fw-bold mb-1">Usuarios y Roles</h2>
                    <p class="text-muted mb-4">
                        Gestiona cuentas del personal y permisos por rol.
                    </p>

                    <div class="tabs-container mb-4">
                        <button class="btn px-4 py-2 border-0"
                                :class="{ active: tabActiva === 'usuarios' }"
                                @click="tabActiva = 'usuarios'">
                            Usuarios
                        </button>
                        <button class="btn px-4 py-2 border-0"
                                :class="{ active: tabActiva === 'roles' }"
                                @click="tabActiva = 'roles'">
                            Roles
                        </button>
                    </div>

                    <section v-if="tabActiva === 'usuarios'">
                        <div class="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                            <div class="input-group bg-white" style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #f0e6da;">
                                <span class="input-group-text bg-transparent border-0">
                                    <i class="bi bi-search text-muted"></i>
                                </span>
                                <input type="text"
                                       class="form-control border-0 bg-transparent"
                                       placeholder="Buscar usuario..."
                                       v-model="busquedaUsuario"
                                       style="box-shadow: none;">
                            </div>
                            <button class="btn btn-brand rounded-3 px-4 py-2 fw-medium"
                                    @click="abrirRegistrarUsuario">
                                <i class="bi bi-plus-lg me-1"></i> Registrar Usuario
                            </button>
                        </div>

                        <div class="custom-table-card shadow-sm">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th class="ps-4 py-3">Nombre</th>
                                        <th class="py-3">Correo</th>
                                        <th class="py-3">Rol</th>
                                        <th class="py-3">Estado</th>
                                        <th class="pe-4 py-3 text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="usuario in usuariosFiltrados" :key="usuario.idUsuario">
                                        <td class="ps-4 py-3 fw-bold">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; background-color: var(--brand-color);">
                                                    <i class="bi bi-person"></i>
                                                </div>
                                                <span>{{ usuario.nombre }} {{ usuario.apellido }}</span>
                                            </div>
                                        </td>
                                        <td class="py-3 text-muted">{{ usuario.correo }}</td>
                                        <td class="py-3">
                                            <span class="badge rounded-pill badge-soft-blue px-3 py-2">
                                                {{ usuario.rol ? usuario.rol.nombreRol : 'Sin rol' }}
                                            </span>
                                        </td>
                                        <td class="py-3">
                                            <span class="badge rounded-pill px-3 py-2"
                                                  :class="claseEstadoCuenta(usuario)">
                                                {{ obtenerEstadoCuenta(usuario) }}
                                            </span>
                                        </td>
                                        <td class="pe-4 py-3 text-end">
                                            <button v-if="obtenerEstadoCuenta(usuario) === 'PENDIENTE'"
                                                    class="btn btn-sm text-muted p-1 me-1"
                                                    @click="reenviarInvitacion(usuario)"
                                                    title="Reenviar invitacion">
                                                <i class="bi bi-envelope fs-5"></i>
                                            </button>
                                            <button class="btn btn-sm text-muted p-1 me-1"
                                                    @click="abrirEditarUsuario(usuario)"
                                                    title="Editar usuario">
                                                <i class="bi bi-pencil-square fs-5"></i>
                                            </button>
                                            <button class="btn btn-sm text-muted p-1"
                                                    @click="eliminarUsuario(usuario)"
                                                    title="Eliminar usuario">
                                                <i class="bi bi-trash fs-5"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="usuariosFiltrados.length === 0">
                                        <td colspan="5" class="text-center py-5 text-muted">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Cargando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section v-if="tabActiva === 'roles'">
                        <div class="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                            <div class="input-group bg-white" style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #f0e6da;">
                                <span class="input-group-text bg-transparent border-0">
                                    <i class="bi bi-search text-muted"></i>
                                </span>
                                <input type="text"
                                       class="form-control border-0 bg-transparent"
                                       placeholder="Buscar rol..."
                                       v-model="busquedaRol"
                                       style="box-shadow: none;">
                            </div>
                            <button class="btn btn-brand rounded-3 px-4 py-2 fw-medium"
                                    @click="abrirRegistrarRol">
                                <i class="bi bi-plus-lg me-1"></i> Registrar Rol
                            </button>
                        </div>

                        <div class="custom-table-card shadow-sm">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th class="ps-4 py-3">Rol</th>
                                        <th class="py-3">Descripcion</th>
                                        <th class="py-3 text-center">Usuarios</th>
                                        <th class="pe-4 py-3 text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="rol in rolesFiltrados" :key="rol.idRol">
                                        <td class="ps-4 py-3 fw-bold">{{ rol.nombreRol }}</td>
                                        <td class="py-3 text-muted">{{ rol.descripcion }}</td>
                                        <td class="py-3 text-center">
                                            <span class="badge rounded-pill badge-soft-orange px-3 py-2">
                                                {{ contarUsuariosPorRol(rol.idRol) }}
                                            </span>
                                        </td>
                                        <td class="pe-4 py-3 text-end">
                                            <button class="btn btn-sm text-muted p-1 me-1"
                                                    @click="abrirEditarRol(rol)"
                                                    title="Editar rol">
                                                <i class="bi bi-pencil-square fs-5"></i>
                                            </button>
                                            <button class="btn btn-sm text-muted p-1"
                                                    @click="eliminarRol(rol)"
                                                    title="Eliminar rol">
                                                <i class="bi bi-trash fs-5"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="rolesFiltrados.length === 0">
                                        <td colspan="5" class="text-center py-5 text-muted">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Cargando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>

        </div>

          <div class="modal fade" id="usuarioModal" tabindex="-1" aria-labelledby="usuarioModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 560px;">
                <div class="modal-content border-0 p-3 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-header border-0 pb-0">
                        <h4 class="modal-title fw-bold" id="usuarioModalLabel" style="color: #2c1a04; font-size: 1.4rem;">
                            {{ modoEdicionUsuario ? 'Editar Usuario' : 'Registrar Nuevo Usuario' }}
                        </h4>
                    </div>

                    <div class="modal-body py-3">
                        <form @submit.prevent="guardarUsuario">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="nombreUsuario" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Nombres</label>
                                    <input type="text" class="form-control px-3 py-2" id="nombreUsuario" v-model="nuevoUsuario.nombre" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="apellidoUsuario" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Apellidos</label>
                                    <input type="text" class="form-control px-3 py-2" id="apellidoUsuario" v-model="nuevoUsuario.apellido" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="correoUsuario" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Correo</label>
                                <input type="email" class="form-control px-3 py-2" id="correoUsuario" v-model="nuevoUsuario.correo" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                            </div>
                            <div class="row">
                                <div v-if="modoEdicionUsuario" class="col-md-6 mb-3">
                                    <label for="claveUsuario" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">
                                        Nueva clave
                                    </label>
                                    <input type="password" class="form-control px-3 py-2" id="claveUsuario" v-model="nuevoUsuario.clave" placeholder="Opcional" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                                </div>
                                <div :class="modoEdicionUsuario ? 'col-md-6 mb-3' : 'col-12 mb-3'">
                                    <label for="rolUsuario" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Rol</label>
                                    <select class="form-select px-3 py-2" id="rolUsuario" v-model="nuevoUsuario.idRol" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                                        <option value="">Seleccione un rol</option>
                                        <option v-for="rol in roles" :key="rol.idRol" :value="rol.idRol">
                                            {{ rol.nombreRol }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <p v-if="!modoEdicionUsuario" class="text-muted small mb-0">
                                Se enviara un enlace al correo para que el usuario cree su contrasena.
                            </p>
                        </form>
                    </div>

                    <div class="modal-footer border-0 pt-0 d-flex gap-3">
                        <button type="button" class="btn btn-light bg-white text-muted w-100 py-2 fw-medium border" data-bs-dismiss="modal" style="border-radius: 8px; border-color: #e2d9cf !important; font-size: 0.95rem;">
                            Cancelar
                        </button>
                        <button type="button" class="btn text-white w-100 py-2 fw-medium" @click="guardarUsuario" style="background-color: var(--brand-color); border-radius: 8px; font-size: 0.95rem;">
                            {{ modoEdicionUsuario ? 'Guardar Cambios' : 'Registrar y enviar invitacion' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="rolModal" tabindex="-1" aria-labelledby="rolModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
                <div class="modal-content border-0 p-3 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-header border-0 pb-0">
                        <h4 class="modal-title fw-bold" id="rolModalLabel" style="color: #2c1a04; font-size: 1.4rem;">
                            {{ modoEdicionRol ? 'Editar Rol' : 'Registrar Nuevo Rol' }}
                        </h4>
                    </div>

                    <div class="modal-body py-3">
                        <form @submit.prevent="guardarRol">
                            <div class="mb-3">
                                <label for="nombreRol" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Nombre del rol</label>
                                <input type="text" class="form-control px-3 py-2" id="nombreRol" v-model="nuevoRol.nombreRol" placeholder="Ej: Administrador" style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;">
                            </div>
                            <div class="mb-2">
                                <label for="descripcionRol" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Descripcion</label>
                                <textarea class="form-control px-3 py-2" id="descripcionRol" rows="4" v-model="nuevoRol.descripcion" placeholder="Describe las responsabilidades del rol..." style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none; resize: none;"></textarea>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer border-0 pt-0 d-flex gap-3">
                        <button type="button" class="btn btn-light bg-white text-muted w-100 py-2 fw-medium border" data-bs-dismiss="modal" style="border-radius: 8px; border-color: #e2d9cf !important; font-size: 0.95rem;">
                            Cancelar
                        </button>
                        <button type="button" class="btn text-white w-100 py-2 fw-medium" @click="guardarRol" style="background-color: var(--brand-color); border-radius: 8px; font-size: 0.95rem;">
                            {{ modoEdicionRol ? 'Guardar Cambios' : 'Registrar' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>


    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import SidebarComponent from '@/components/SidebarComponent.vue';
import NavbarComponent from '@/components/NavbarComponent.vue';
import * as usuarioService from '@/services/usuarioService.js';

// --- Estado (Refs) ---
const tabActiva = ref('usuarios');
const usuarios = ref([]);
const roles = ref([]);
const busquedaUsuario = ref('');
const busquedaRol = ref('');
const modoEdicionUsuario = ref(false);
const usuarioEditandoId = ref(null);
const modoEdicionRol = ref(false);
const rolEditandoId = ref(null);

const nuevoUsuario = ref({
    nombre: '',
    apellido: '',
    correo: '',
    clave: '',
    idRol: ''
});

const nuevoRol = ref({
    nombreRol: '',
    descripcion: ''
});

// --- Propiedades Computadas (Computed) ---
const usuariosFiltrados = computed(() => {
    const termino = busquedaUsuario.value.trim().toLowerCase();
    if (!termino) return usuarios.value;

    return usuarios.value.filter(usuario => {
        const rol = usuario.rol ? usuario.rol.nombreRol : '';
        const estado = obtenerEstadoCuenta(usuario);
        return [
            usuario.nombre,
            usuario.apellido,
            usuario.correo,
            rol,
            estado
        ].some(valor => (valor || '').toLowerCase().includes(termino));
    });
});

const rolesFiltrados = computed(() => {
    const termino = busquedaRol.value.trim().toLowerCase();
    if (!termino) return roles.value;

    return roles.value.filter(rol => {
        return [
            rol.nombreRol,
            rol.descripcion
        ].some(valor => (valor || '').toLowerCase().includes(termino));
    });
});

// --- Métodos de Carga (API) ---
const obtenerEstadoCuenta = (usuario) => {
    if (usuario.estadoCuenta) return usuario.estadoCuenta;
    if (usuario.pendiente) return 'PENDIENTE';
    if (usuario.disponible === false) return 'INACTIVO';
    return 'ACTIVO';
};

const claseEstadoCuenta = (usuario) => {
    const estado = obtenerEstadoCuenta(usuario);

    if (estado === 'PENDIENTE') return 'badge-soft-orange';
    if (estado === 'INACTIVO') return 'text-bg-secondary';
    return 'badge-soft-blue';
};

const cargarUsuarios = async () => {
    try {
        usuarios.value = await usuarioService.obtenerUsuarios();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
};

const cargarRoles = async () => {
    try {
        roles.value = await usuarioService.obtenerRoles();
    } catch (error) {
        console.error('Error cargando roles:', error);
    }
};

// --- Control de Modales (Limpieza Absoluta de Backdrop) ---
const cerrarModal = (idModal) => {
    const modalElement = document.getElementById(idModal);
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }

    // Remoción forzada inmediata y en diferido de capas oscuras residuales
    // Esto evita que los re-renders asíncronos de Vue interrumpan a Bootstrap
    const limpiarResiduosDOM = () => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    limpiarResiduosDOM();
    setTimeout(limpiarResiduosDOM, 300); // Sincronizado con la transición CSS de Bootstrap
};

// --- Gestión de Usuarios ---
const reiniciarModalUsuario = () => {
    modoEdicionUsuario.value = false;
    usuarioEditandoId.value = null;
    nuevoUsuario.value = { nombre: '', apellido: '', correo: '', clave: '', idRol: '' };
};

const abrirRegistrarUsuario = () => {
    reiniciarModalUsuario();
    const modalElement = document.getElementById('usuarioModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
};

const abrirEditarUsuario = (usuario) => {
    modoEdicionUsuario.value = true;
    usuarioEditandoId.value = usuario.idUsuario;
    nuevoUsuario.value = {
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        correo: usuario.correo || '',
        clave: '',
        idRol: usuario.rol ? usuario.rol.idRol : ''
    };

    const modalElement = document.getElementById('usuarioModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
};

const validarUsuario = () => {
    if (!nuevoUsuario.value.nombre.trim()) return alert('El nombre del usuario es obligatorio.') && false;
    if (!nuevoUsuario.value.apellido.trim()) return alert('El apellido del usuario es obligatorio.') && false;
    if (!nuevoUsuario.value.correo.trim()) return alert('El correo es obligatorio.') && false;
    if (!nuevoUsuario.value.correo.includes('@')) return alert('El correo no tiene un formato válido.') && false;
    if (!nuevoUsuario.value.idRol) return alert('El rol del usuario es obligatorio.') && false;
    return true;
};

const guardarUsuario = async () => {
    if (!validarUsuario()) return;

    const payload = {
        nombre: nuevoUsuario.value.nombre.trim(),
        apellido: nuevoUsuario.value.apellido.trim(),
        correo: nuevoUsuario.value.correo.trim(),
        idRol: Number(nuevoUsuario.value.idRol)
    };

    const clave = nuevoUsuario.value.clave.trim();
    if (modoEdicionUsuario.value && clave) {
        payload.clave = clave;
    }

    try {
        const creandoUsuario = !modoEdicionUsuario.value;

        if (modoEdicionUsuario.value) {
            await usuarioService.actualizarUsuario(usuarioEditandoId.value, payload);
        } else {
            await usuarioService.crearUsuario(payload);
        }

        cerrarModal('usuarioModal');
        await cargarUsuarios();

        if (creandoUsuario) {
            alert('Usuario registrado. Se envio el enlace de activacion al correo.');
        }
    } catch (error) {
        console.error('Error guardando usuario:', error);
        const mensaje = error.response?.data?.mensaje || error.response?.data?.message;
        alert(mensaje || 'No se pudo guardar el usuario.');
    }
};

const eliminarUsuario = async (usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
    if (!confirm(`¿Deseas eliminar a "${nombreCompleto}"?`)) return;

    try {
        await usuarioService.eliminarUsuario(usuario.idUsuario);
        await cargarUsuarios();
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('No se pudo eliminar el usuario.');
    }
};

// --- Gestión de Roles ---
const reenviarInvitacion = async (usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
    if (!confirm(`Deseas reenviar la invitacion a "${nombreCompleto}"?`)) return;

    try {
        await usuarioService.reenviarActivacionUsuario(usuario.idUsuario);
        await cargarUsuarios();
        alert('Invitacion reenviada correctamente.');
    } catch (error) {
        console.error('Error reenviando invitacion:', error);
        const mensaje = error.response?.data?.mensaje || error.response?.data?.message;
        alert(mensaje || 'No se pudo reenviar la invitacion.');
    }
};

const reiniciarModalRol = () => {
    modoEdicionRol.value = false;
    rolEditandoId.value = null;
    nuevoRol.value = { nombreRol: '', descripcion: '' };
};

const abrirRegistrarRol = () => {
    reiniciarModalRol();
    const modalElement = document.getElementById('rolModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
};

const abrirEditarRol = (rol) => {
    modoEdicionRol.value = true;
    rolEditandoId.value = rol.idRol;
    nuevoRol.value = {
        nombreRol: rol.nombreRol || '',
        descripcion: rol.descripcion || ''
    };

    const modalElement = document.getElementById('rolModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }
};

const validarRol = () => {
    if (!nuevoRol.value.nombreRol.trim()) return alert('El nombre del rol es obligatorio.') && false;
    return true;
};

const guardarRol = async () => {
    if (!validarRol()) return;

    const payload = {
        nombreRol: nuevoRol.value.nombreRol.trim(),
        descripcion: nuevoRol.value.descripcion ? nuevoRol.value.descripcion.trim() : ''
    };

    try {
        if (modoEdicionRol.value) {
            await usuarioService.actualizarRol(rolEditandoId.value, payload);
        } else {
            await usuarioService.crearRol(payload);
        }

        cerrarModal('rolModal');
        await cargarRoles();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error guardando rol:', error);
        const mensaje = error.response?.data?.mensaje || error.response?.data?.message;
        alert(mensaje || 'No se pudo guardar el rol.');
    }
};

const contarUsuariosPorRol = (idRol) => {
    return usuarios.value.filter(usuario => usuario.rol && usuario.rol.idRol === idRol).length;
};

const eliminarRol = async (rol) => {
    const usuariosAsignados = contarUsuariosPorRol(rol.idRol);
    if (usuariosAsignados > 0) {
        alert('No puedes eliminar un rol con usuarios asignados. Reasigna esos usuarios primero.');
        return;
    }

    if (!confirm(`¿Deseas eliminar el rol "${rol.nombreRol}"?`)) return;

    try {
        await usuarioService.eliminarRol(rol.idRol);
        await cargarRoles();
    } catch (error) {
        console.error('Error eliminando rol:', error);
        alert('No se pudo eliminar el rol.');
    }
};

// --- Ciclo de Vida ---
onMounted(() => {
    cargarRoles();
    cargarUsuarios();

    const modalUsuario = document.getElementById('usuarioModal');
    const modalRol = document.getElementById('rolModal');

    if (modalUsuario) modalUsuario.addEventListener('hidden.bs.modal', reiniciarModalUsuario);
    if (modalRol) modalRol.addEventListener('hidden.bs.modal', reiniciarModalRol);
});
</script>
