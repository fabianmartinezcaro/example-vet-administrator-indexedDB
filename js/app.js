// --- VARIABLES ----

// BBDD
let DB;

// CONTENIDO
const contenido = document.querySelector('#contenido');

// FORMULARIO
const formulario = document.querySelector('#nueva-cita')

// COLECCIÓN CITAS
const contenedorCitas = document.querySelector('#citas')

// DATOS
const mascotaInput = document.querySelector('#mascota');
const propietarioInput = document.querySelector('#propietario');
const telefonoInput = document.querySelector('#telefono');
const fechaInput = document.querySelector('#fecha');
const horaInput = document.querySelector('#hora');
const sintomasInput = document.querySelector('#sintomas');

let editando;


// --- CLASES ---
class Citas{
    constructor(){
        this.citas = [];
    }

    nuevaCita(cita){
        this.citas = [...this.citas, cita];
    }

    borrarCita(id){
        this.citas = this.citas.filter(cita => cita.id !== id);
    }

    editarCita(citaActualizada){
        this.citas = this.citas.map(cita => cita.id === citaActualizada.id ? citaActualizada : cita);
    }

}

class UI{

    mostrarCitas(){

        this.limpiarHTML();

        // Leer el contenido de la base de datos:
        const objectStore = DB.transaction('citas').objectStore('citas');

        objectStore.openCursor().onsuccess = function (event){

            const cursor = event.target.result;

            if(cursor){

                const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cursor.value;

                // DIV información
                const divCita = document.createElement('DIV');
                divCita.classList.add('cita','p-3');
                divCita.dataset.id = id; 

                // Información de la cita
                const parrafoMascota = document.createElement('h2');
                parrafoMascota.classList.add('card-title', 'font-weight-bolder');
                parrafoMascota.textContent = mascota;

                const parrafoPropietario = document.createElement('p');
                parrafoPropietario.innerHTML = `
                    <span class="font-weight-bolder">Propietario:</span> ${propietario}
                `;

                const parrafoTelefono = document.createElement('p');
                parrafoTelefono.innerHTML = `
                    <span class="font-weight-bolder">Teléfono:</span> ${telefono}
                `;

                const parrafoFecha = document.createElement('p');
                parrafoFecha.innerHTML = `
                    <span class="font-weight-bolder">Fecha:</span> ${fecha}
                `;

                const parrafoHora = document.createElement('p');
                parrafoHora.innerHTML = `
                    <span class="font-weight-bolder">Hora:</span> ${hora}
                `;

                const parrafoSintomas = document.createElement('p');
                parrafoSintomas.innerHTML = `
                    <span class="font-weight-bolder">Síntomas:</span> ${sintomas}
                `;


                // Boton editar
                const botonEditar = document.createElement('a');
                botonEditar.classList.add('btn', 'btn-secondary', 'm-2');
                botonEditar.textContent = 'Editar';
                divCita.appendChild(botonEditar);
                const cita = cursor.value
                botonEditar.onclick = () => cargarEdicion(cita)

                // Boton eliminar
                const botonEliminar = document.createElement('a');
                botonEliminar.classList.add('btn', 'btn-danger', 'text-white', 'm-2');
                botonEliminar.textContent = 'Eliminar';
                botonEliminar.onclick =  () => {
                    eliminarCita(id); // ELIMINAR
                }

                // Incluímos la información en el div de la cita
                divCita.appendChild(parrafoMascota);
                divCita.appendChild(parrafoPropietario);
                divCita.appendChild(parrafoTelefono);
                divCita.appendChild(parrafoFecha);
                divCita.appendChild(parrafoHora);
                divCita.appendChild(parrafoSintomas);

                // Botones
                divCita.appendChild(botonEliminar);
                divCita.appendChild(botonEditar);

                contenedorCitas.appendChild(divCita);

                cursor.continue();

                }

        }
        
    }

    mostrarAlerta(contenedor, mensaje, tipo){

        const divAlerta = document.createElement('DIV');
        divAlerta.textContent = mensaje;
        let condicionCumplida = false;

        if(tipo === 'error'){
            divAlerta.classList.add('alert', 'alert-danger');
            contenedor.appendChild(divAlerta);
            condicionCumplida = true;
        }else if(tipo === 'correcto'){
            divAlerta.classList.add('alert', 'alert-success');
            contenedor.appendChild(divAlerta);
            condicionCumplida = true;
        }

        if(condicionCumplida){
            setTimeout(() => {
                divAlerta.remove();
            }, 3000);
        }

    }

    limpiarHTML(){
        while(contenedorCitas.firstChild){
            contenedorCitas.removeChild(contenedorCitas.firstChild);
        }
    }

}

// INSTANCIAS
const ui = new UI()
const administrarCitas = new Citas();

// // --- ADD EVENT LISTENERS ----

window.onload = () => {
    cargarAddEventListeners();
    crearDB();
}

function cargarAddEventListeners(){

    mascotaInput.addEventListener('input', datosCita)
    propietarioInput.addEventListener('input', datosCita)
    telefonoInput.addEventListener('input', datosCita)
    fechaInput.addEventListener('input', datosCita)
    horaInput.addEventListener('input', datosCita)
    sintomasInput.addEventListener('input', datosCita)

    formulario.addEventListener('submit', agregarCita);

}

// Objeto cita
const objetoCita = {
    mascota: '',
    propietario: '',
    telefono: '',
    fecha: '',
    hora: '',
    sintomas: '',
}

// FUNCIONES

// Leemos los datos del input
function datosCita(evento){
    objetoCita[evento.target.name] = evento.target.value;
}

// Valida y agrega una nueva cita
function agregarCita(evento){
    evento.preventDefault();
    // Extraemos los datos del objeto cita
    const {mascota, propietario, telefono, fecha, hora, sintomas} = objetoCita;

    if(mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === ''){
        ui.mostrarAlerta(formulario, 'Todos los campos son obligatorios', 'error');
        return;
    }

    if(editando){

        administrarCitas.editarCita({...objetoCita});

        const transaction = DB.transaction(['citas'], 'readwrite');

        const objectStore = transaction.objectStore('citas');

        objectStore.put(objetoCita);
        
        transaction.oncomplete = () => {
            ui.mostrarAlerta(formulario, 'Editado correctamente', 'correcto')

            // Regresa el texto del botón a su estado original
            formulario.querySelector('button[type="submit"]').textContent = 'Crear Cita';
            editando = false;
        }

        transaction.onerror = () => 'Hubo un error';

    }else{
        objetoCita.id = Date.now();

        // Agregamos una cita al objeto
        administrarCitas.nuevaCita({...objetoCita});

        // Insertar registro en IndexedDB
        const transaction = DB.transaction(['citas'], 'readwrite')

        // Habilitamos el objectStore
        const objectStore = transaction.objectStore('citas');

        // Insertar en la base de datos
        objectStore.add(objetoCita);

        transaction.oncomplete = function () {
            console.log('Cita guardada correctamente en IndexedDB')
            ui.mostrarAlerta(formulario, 'Cita agregada correctamente', 'correcto')
        }
    }

    ui.limpiarHTML();

    // Mostrar el html
    
    ui.mostrarCitas();

    // Reiniciamos el objeto
    reiniciarObjeto();
    formulario.reset();

}


function eliminarCita(id){

    ui.limpiarHTML();

    administrarCitas.borrarCita(id);

    const transaction = DB.transaction(['citas'], 'readwrite');
    const objectStore = transaction.objectStore('citas');

    objectStore.delete(id);

    transaction.oncomplete = () => {
        console.log(`Cita ${id} eliminada`)
        ui.mostrarCitas();
    };

    transaction.onerror = () => {
        console.log('Hubo un error')
    }

}


function cargarEdicion(cita){
    console.log(cita)

    const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cita;

    // Colocamos los valores de la cita en los inputs
    mascotaInput.value = mascota;
    propietarioInput.value = propietario;
    telefonoInput.value = telefono;
    fechaInput.value = fecha;
    horaInput.value = hora;
    sintomasInput.value = sintomas; 

    // Llenamos el objeto global
    objetoCita.mascota = mascota;
    objetoCita.propietario = propietario;
    objetoCita.telefono = telefono;
    objetoCita.fecha = fecha;
    objetoCita.hora = hora;
    objetoCita.sintomas = sintomas;
    objetoCita.id = id;

    formulario.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';

    editando = true;

}


function reiniciarObjeto(){

    objetoCita.mascota = '';
    objetoCita.propietario = '';
    objetoCita.telefono = '';
    objetoCita.fecha = '';
    objetoCita.hora = '';
    objetoCita.sintomas = '';

}


function crearDB(){
    // Creamos la base de datos
    const vetDB = window.indexedDB.open('citasVet', 1)

    // Si hay algun error en la creación:
    vetDB.onerror = function () {
        console.log('Error al crear la DB!');
    }

    // Si se crea correctamente:
    vetDB.onsuccess = function () {
        console.log('DB creada correctamente!')
        DB = vetDB.result;
        console.log(DB)

        // Mostrar las citas al cargar (Pero indexedDB ya esta listo)
        ui.mostrarCitas();
    }

    // Definir Schema
    vetDB.onupgradeneeded = function (event) {
        const db = event.target.result;
        
        const objectStore = db.createObjectStore("citas", {
            keyPath: 'id',
            autoIncrement: true
        })

        // Definir las columnas
        objectStore.createIndex('mascota', 'mascota', {unique: false})
        objectStore.createIndex('propietario', 'propietario', {unique: false})
        objectStore.createIndex('telefono', 'telefono', {unique: false})
        objectStore.createIndex('fecha', 'fecha', {unique: false})
        objectStore.createIndex('hora', 'hora', {unique: false})
        objectStore.createIndex('sintomas', 'sintomas', {unique: false})
        objectStore.createIndex('id', 'id', {unique: true})

        console.log('DB creada y lista!')

    }

}


