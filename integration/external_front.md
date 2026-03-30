# LIBRERÍA FRONT-END (INTEGRACIÓN EXTERNA DE LOCALIZ.AR)

Integrar localiz.ar en el Front-End de tu aplicación es tan fácil como:

1 - Linkear el CSS y el JS de la librería

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/santiagomirantes/localiz.ar/helper/helper.css"
/>

<script src="https://cdn.jsdelivr.net/gh/santiagomirantes/localiz.ar/helper/helper.js"></script>
```

2 - agregar el contenedor del formulario (si ya tenés un formulario hecho salteate este paso)

```html
<form>
  <div id="localiz_ar"></div>
  <button class="submit"></button>
</form>
```

3 - ejecutar el script de inicialización

```js
async fn() {
    //debido a que el método es asincrónico lo ejecutamos en un entorno asincrónico
     const data = await localiz_ar.start({
        //'parent' es el contenedor del formulario
        //los inputs de direcciones se van a crear automáticamente como hijos
        //si querés asignar los inputs manualmente visitá la sección de 'CONFIGURACIÓN' mas adelante
        parent: document.querySelector("#localiz_ar")
     })

     //seleccionamos el botón del envio del formulario
     const submitButton = document.querySelector("#submit");

    submitButton.onclick = (ev) => {
        try {
         ev.preventDefault();
         const validation = localiz_ar.validate(data);
         //el objeto que retorna 'validate' es el que después debe ser enviado al Back-End
         console.log(validation)
        } catch (err) {
          //el mensaje de error ya está orientado hacia el usuario final
          console.log(err.message)
        }
    };

}
fn()
```

## CONFIGURACIÓN

El método `localiz_ar.start()` recibe como único párametro un objeto `config` que permite personalizar la experiencia con las siguientes propiedades:

| propiedad      | tipo de valor                                            | explicación                                                                                                                                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parent`       | `Node` (default = `null`)                                | el elemento padre del formulario, donde se van a crear los inputs automáticos. Obligatorio a menos que `avoid_parent` sea `true`                                                                                                                                                                                                |
| `avoid_parent` | `Boolean` (default = `false`)                            | si es `true`, evita que la propiedad `parent` sea necesaria (tener en cuenta que si `parent` es `null` todos los inputs deben ser creados y dados manualmente)                                                                                                                                                                  |
| `max`          | `Number` (default = `5`)                                 | Indicá la cantidad máxima de resultados a mostrar en los inputs de Ciudades (`cities`) y Calles (`streets`)                                                                                                                                                                                                                     |
| `exclude`      | [Objeto de inputs](#objeto-de-inputs) (default = `null`) | define los inputs que se tienen que excluir en la verificación. La verificación es en cascada según especificidad. Es decir, por ejemplo, si se excluye el campo de 'Calles' (`streets`), el formulario tampoco incluirá los campos de 'Número de calle' (`number`) y 'Piso' (`floor`)                                          |
| `inputs`       | [Objeto de inputs](#objeto-de-inputs) (default = `null`) | permite dar inputs ya presentes en el documento para que tomen el rol de un campo y así evitar que se generen automáticamente. Los inputs de los campos 'Ciudades' (`cities`) y 'Calles' (`streets`) deben estar encapsulados en un `div` para que la lista de resultados de busqueda (el `dropdown`) se pueda añadir al padre. |
| `labels`       | [Objeto de inputs](#objeto-de-inputs) (default = `null`) | permite definir los [labels](https://developer.mozilla.org/es/docs/Web/HTML/Reference/Elements/label) atribuidos a cada input.                                                                                                                                                                                                  |
| `placeholders` | [Objeto de inputs](#objeto-de-inputs) (default = `null`) | permite definir los [placeholders](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/placeholder) atribuidos a cada input.                                                                                                                                                                                 |

### OBJETO DE INPUTS

Un objeto de inputs es un objeto donde cada propiedad representa a un campo del formulario. Los campos posibles son:

```js
{
  "provs": "campo de provincias",
  "cities": "campo de ciudades",
  "streets": "campo de calles",
  "number": "campo de número de calle",
  "floor": "campo de piso"
}
```

El valor de los campos depende de que se quiere configurar:

- `exclude`: cada campo deberá tener un `Booleano` donde `true` indica que se tiene que excluir.
- `inputs`: cada campo deberá tener un `Nodo` correspondiente al elemento que se quiere vincular con la librería (o de lo contrario un valor nulo).
- `labels` y `placeholders`: cada campo deberá tener un `String`.

> **IMPORTANTE:** el objeto de inputs puede recibir un campo adicional `license` al configurar la propiedad `exclude`. Esto permite excluir el texto de la licencia generado automáticamente al final del formulario. **ESTO SOLO SE DEBE EXCLUIR SI EL MISMO TEXTO ESTÁ PRESENTE DE FORMA CLARAMENTE VISIBLE EN OTRA PARTE DEL DOCUMENTO**.

## EJEMPLO DE UNA CONFIGURACIÓN COMPLETA

```js
const config = {
  parent: document.getElementById("localiz_ar"),

  avoid_parent: false,

  exclude: {
    number: true, // no se pide número de calle y, por lo tanto, tampoco piso
    license: false, // se mantiene la licencia visible
  },

  inputs: {
    provs: document.getElementById("provincia"),
    cities: document.getElementById("ciudad"), // el input debe tener un div como padre
    streets: document.getElementById("calle"), // el input debe tener un div como padre
  },

  labels: {
    provs: "Provincia",
    cities: "Ciudad",
    streets: "Calle",
  },

  placeholders: {
    provs: "Seleccioná una provincia",
    cities: "Ingresá una ciudad",
    streets: "Ingresá una calle",
  },
};

localiz_ar.start(config);
```

## VERIFICACIÓN BACK-END

Una vez que el Front-End ya está correctamente configurado, los datos de localiz.ar pueden ser verificados en el Back-End con las siguientes liberías:

[Verificación con NodeJS](https://www.npmjs.com/package/localiz-ar-node)
[Verificación con Python](https://pypi.org/project/localiz-ar)

[Volver atrás](https://github.com/santiagomirantes/localiz.ar/blob/main/integration/external_index.md)
