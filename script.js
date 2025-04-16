document.addEventListener('DOMContentLoaded', () => {
    // Cache de elementos del DOM
    const elements = {
        form: document.getElementById('formularioRegistro'),
        inputs: {
            nombre: document.getElementById('nombre'),
            apellido: document.getElementById('apellido'),
            correo: document.getElementById('correo'),
            apodo: document.getElementById('apodo'),
            juego: document.getElementById('juego'),
            fechaNacimiento: document.getElementById('fechaNacimiento'),
            comentarios: document.getElementById('comentarios'),
            avatar: document.getElementById('avatar'),
            terminos: document.getElementById('terminos')
        },
        ui: {
            campoEquipo: document.getElementById('campoEquipo'),
            vistaPreviaAvatar: document.getElementById('vistaPreviaAvatar'),
            imagenPrevia: document.getElementById('imagenPrevia'),
            textoSinImagen: document.getElementById('textoSinImagen'),
            contadorCaracteres: document.getElementById('contadorCaracteres'),
            botonEnviar: document.getElementById('botonEnviar'),
            textoBoton: document.getElementById('textoBoton'),
            cargador: document.getElementById('cargador'),
            botonTema: document.getElementById('botonTema'),
            sonidoExito: document.getElementById('sonidoExito'),
            mensajeFormulario: document.getElementById('mensajeFormulario')
        },
        errors: {
            nombre: document.getElementById('errorNombre'),
            apellido: document.getElementById('errorApellido'),
            correo: document.getElementById('errorCorreo'),
            apodo: document.getElementById('errorApodo'),
            fechaNacimiento: document.getElementById('errorFechaNacimiento')
        }
    };

    // Expresiones regulares
    const regex = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        apodo: /^[\w]{3,15}$/
    };

    // Configuración de eventos
    const setupEventListeners = () => {
        // Validación en tiempo real
        elements.inputs.nombre.addEventListener('input', validarNombre);
        elements.inputs.apellido.addEventListener('input', validarApellido);
        elements.inputs.correo.addEventListener('input', validarCorreo);
        elements.inputs.apodo.addEventListener('input', validarApodo);
        elements.inputs.fechaNacimiento.addEventListener('input', validarFechaNacimiento);
        elements.inputs.comentarios.addEventListener('input', actualizarContadorCaracteres);
        
        // Cambio de juego
        elements.inputs.juego.addEventListener('change', handleJuegoChange);
        
        // Vista previa de avatar
        elements.inputs.avatar.addEventListener('change', handleAvatarChange);
        
        // Tema
        elements.ui.botonTema.addEventListener('click', alternarTema);
        
        // Envío de formulario
        elements.form.addEventListener('submit', handleFormSubmit);
    };

    // Handlers de eventos
    const handleJuegoChange = () => {
        const { value } = elements.inputs.juego;
        const juegosEquipo = ['valorant', 'lol', 'csgo', 'fc25'];
        elements.ui.campoEquipo.style.display = juegosEquipo.includes(value) ? 'block' : 'none';
    };

    const handleAvatarChange = () => {
        const [file] = elements.inputs.avatar.files;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.ui.imagenPrevia.src = e.target.result;
                elements.ui.imagenPrevia.style.display = 'block';
                elements.ui.textoSinImagen.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            elements.ui.imagenPrevia.style.display = 'none';
            elements.ui.textoSinImagen.style.display = 'block';
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) return;
        
        mostrarCargador();
        
        try {
            const formData = new FormData(elements.form);
            const response = await fetch(elements.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Formspree puede devolver diferentes tipos de respuestas
            if (response.ok) {
                // Respuesta exitosa (200-299)
                const data = await response.json();
                manejarExito();
            } else if (response.redirected) {
                // Formspree redirigió (302)
                manejarExito();
            } else {
                // Error real del servidor
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al enviar el formulario');
            }
        } catch (error) {
            console.error('Error:', error);
            // Solo mostrar alerta si es un error real de red
            if (!error.message.includes('Failed to fetch')) {
                mostrarErrorEnvio();
            }
        } finally {
            ocultarCargador();
        }
    };

    const manejarExito = () => {
        elements.ui.sonidoExito.play().catch(e => console.error('Error al reproducir sonido:', e));
        elements.ui.mensajeFormulario.style.display = 'block';
        resetearFormulario();
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            elements.ui.mensajeFormulario.style.display = 'none';
        }, 5000);
    };

    const mostrarErrorEnvio = () => {
        alert('Hubo un problema al conectar con el servidor. Por favor, verifica tu conexión e inténtalo nuevamente.');
    };

    // Funciones de validación (se mantienen igual)
    const validarCampo = (campo, errorElement, minLength = 2) => {
        const valor = campo.value.trim();
        if (!valor) return { valido: false, mensaje: 'Este campo es requerido' };
        if (valor.length < minLength) return { valido: false, mensaje: `Mínimo ${minLength} caracteres` };
        return { valido: true };
    };

    const validarNombre = () => {
        const { valido, mensaje } = validarCampo(elements.inputs.nombre, elements.errors.nombre);
        if (!valido) return mostrarError(elements.inputs.nombre, elements.errors.nombre, mensaje);
        return limpiarError(elements.inputs.nombre, elements.errors.nombre);
    };

    const validarApellido = () => validarNombre.call();

    const validarCorreo = () => {
        const valor = elements.inputs.correo.value.trim();
        if (!valor) return mostrarError(elements.inputs.correo, elements.errors.correo, 'El email es requerido');
        if (!regex.email.test(valor)) return mostrarError(elements.inputs.correo, elements.errors.correo, 'Ingresa un email válido');
        return limpiarError(elements.inputs.correo, elements.errors.correo);
    };

    const validarApodo = () => {
        const valor = elements.inputs.apodo.value.trim();
        if (!valor) return mostrarError(elements.inputs.apodo, elements.errors.apodo, 'El nickname es requerido');
        if (!regex.apodo.test(valor)) return mostrarError(elements.inputs.apodo, elements.errors.apodo, 'Solo letras, números y _ (3-15 caracteres)');
        return limpiarError(elements.inputs.apodo, elements.errors.apodo);
    };

    const validarFechaNacimiento = () => {
        const { value } = elements.inputs.fechaNacimiento;
        if (!value) return mostrarError(elements.inputs.fechaNacimiento, elements.errors.fechaNacimiento, 'La fecha es requerida');
        
        const fechaNac = new Date(value);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const diffMes = hoy.getMonth() - fechaNac.getMonth();
        
        if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
        
        if (edad < 13) return mostrarError(elements.inputs.fechaNacimiento, elements.errors.fechaNacimiento, 'Debes tener al menos 13 años');
        return limpiarError(elements.inputs.fechaNacimiento, elements.errors.fechaNacimiento);
    };

    const actualizarContadorCaracteres = () => {
        const count = elements.inputs.comentarios.value.length;
        elements.ui.contadorCaracteres.textContent = count;
        
        const hasError = count > 200;
        elements.inputs.comentarios.style.borderColor = hasError ? 'var(--color-error)' : 'var(--color-borde)';
        elements.ui.contadorCaracteres.style.color = hasError ? 'var(--color-error)' : 'var(--color-marcador)';
    };

    const validarFormulario = () => {
        const validaciones = [
            validarNombre(),
            validarApellido(),
            validarCorreo(),
            validarApodo(),
            validarFechaNacimiento(),
            elements.inputs.terminos.checked || (alert('Debes aceptar los términos') && false)
        ];
        
        return validaciones.every(Boolean);
    };

    // Helpers de UI
    const mostrarError = (input, errorElement, mensaje) => {
        input.style.borderColor = 'var(--color-error)';
        errorElement.textContent = mensaje;
        return false;
    };

    const limpiarError = (input, errorElement) => {
        input.style.borderColor = 'var(--color-borde)';
        errorElement.textContent = '';
        return true;
    };

    const mostrarCargador = () => {
        elements.ui.textoBoton.textContent = 'Enviando...';
        elements.ui.cargador.style.display = 'block';
        elements.ui.botonEnviar.disabled = true;
    };

    const ocultarCargador = () => {
        elements.ui.cargador.style.display = 'none';
        elements.ui.textoBoton.textContent = 'Enviar Inscripción';
        elements.ui.botonEnviar.disabled = false;
    };

    const resetearFormulario = () => {
        elements.form.reset();
        elements.ui.imagenPrevia.style.display = 'none';
        elements.ui.textoSinImagen.style.display = 'block';
        elements.ui.campoEquipo.style.display = 'none';
        elements.ui.contadorCaracteres.textContent = '0';
        
        // Limpiar errores
        Object.values(elements.errors).forEach(error => error.textContent = '');
        Object.values(elements.inputs).forEach(input => {
            if (input.style) input.style.borderColor = '';
        });
    };

    const alternarTema = () => {
        document.body.classList.toggle('modo-oscuro');
        const icon = elements.ui.botonTema.querySelector('i');
        const isDark = document.body.classList.contains('modo-oscuro');
        
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
        localStorage.setItem('tema', isDark ? 'oscuro' : 'claro');
    };

    // Inicialización
    const init = () => {
        setupEventListeners();
        
        // Cargar tema guardado
        if (localStorage.getItem('tema') === 'oscuro') {
            document.body.classList.add('modo-oscuro');
            elements.ui.botonTema.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
        
        // Manejar parámetro de éxito en la URL
        if (window.location.search.includes('success=true')) {
            manejarExito();
            // Limpiar la URL
            history.replaceState(null, '', window.location.pathname);
        }
    };

    init();
});