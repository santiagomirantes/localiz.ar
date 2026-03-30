const localiz_ar = {

    localiz_ar_cities_focus: false,

    removeTicks(str) {
        return str
            .replace(/ñ/g, "__enie__")
            .replace(/Ñ/g, "__ENIE__")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/__enie__/g, "ñ")
            .replace(/__ENIE__/g, "Ñ");
    },

    getWeekVersion() {
        const now = new Date();

        // Convertir a UTC
        const date = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        // ISO week: mover al jueves de esta semana
        const day = date.getUTCDay() || 7; // domingo = 7
        date.setUTCDate(date.getUTCDate() + 4 - day);

        // Año ISO
        const year = date.getUTCFullYear();

        // Primer día del año ISO
        const yearStart = new Date(Date.UTC(year, 0, 1));

        // Calcular semana
        const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

        // Formato 2 dígitos
        const weekStr = String(week).padStart(2, '0');

        return `${weekStr}-${year}`;
    },

    get_matches(value, options) {

        if (!value) return [[], {}]

        let word = ""
        let matches = []
        let matchesList = {}

        for (let pos in value) {
            const char = value[pos].toLowerCase()
            const formattedChar = localiz_ar.removeTicks(char)
            if (char === " ") {
                word = ""
                continue
            }

            if (pos === "0") {
                const ids = options[formattedChar]

                if (!ids) return [[], {}]

                matches = ids

                for (const [id, posInString] of matches) {
                    matchesList[id] = [posInString, posInString]
                }
            }

            //if it´s the first char of a word but not the zero char
            else if (word === "") {
                const ids = options[formattedChar]

                if (!ids) return [[], {}]

                let newMatches = []
                let newMatchesList = {}

                for (const [id, posInString] of ids) {
                    if (matchesList[id]) {
                        newMatches.push([id, posInString])
                        newMatchesList[id] = [matchesList[id][0], posInString]
                    }
                }

                if (newMatches.length === 0) {
                    return [[], {}]
                }

                matches = newMatches
                matchesList = newMatchesList
            }

            else {

                let newMatches = []
                let newMatchesList = {}

                for (const [id, posInString] of matches) {
                    const str = options["_" + id]
                    if (localiz_ar.removeTicks(str[posInString + 1]) === formattedChar) {
                        newMatches.push([id, posInString + 1])
                        newMatchesList[id] = [posInString - (matchesList[id][1] - matchesList[id][0]), posInString + 1]
                    }
                }

                if (newMatches.length === 0) return [[], {}]

                matches = newMatches
                matchesList = newMatchesList

            }

            word += char

        }

        return [matches, matchesList]

    },

    show_matches(matches, matchesList, input, dropdown, options, max = 5) {

        if (isNaN(parseInt(max)) || max <= 0) {
            max = 5
        }

        dropdown.innerHTML = ""

        if (matches.length === 0) {
            const p = document.createElement("p")
            p.textContent = "Sin resultados."
            p.className = "localiz_ar_no_results"
            dropdown.appendChild(p)
            return
        }

        const list = {}
        let count = 0

        for (const [id, posInString] of matches) {

            if(count >= max) continue

            const firstPos = matchesList[id][0]
            const lastPos = matchesList[id][1]

            if (lastPos !== posInString) continue

            if (!list[id]) {
                count++
                const p = document.createElement("p")
                list[id] = p
                p.innerHTML = options["_" + id]
                p.className = "localiz_ar_option"
                p.onmousedown = ev => {
                    localiz_ar[input.className + "_focus"] = true
                    input.value = options["_" + id]
                    input.setAttribute("_id", id)
                }
                p.onclick = ev => {
                    localiz_ar[input.className + "_focus"] = false
                    dropdown.innerHTML = ""
                }
                dropdown.appendChild(p)
            }

            let text = list[id].innerHTML
            let currentPos = text.length - 1
            let newText = ""
            let isBold = false
            let isTag = false
            while (currentPos >= 0) {

                if (currentPos === posInString) {
                    isBold = true
                    newText = "</b>" + newText
                }
                newText = text[currentPos] + newText

                if (currentPos === firstPos) {
                    isBold = false
                    newText = "<b>" + newText
                }
                currentPos -= 1
            }
            list[id].innerHTML = newText
        }

    },

    async start(config = {}) {

        const parent = config.parent

        if (!(config.parent instanceof Node) && !config.avoid_parent) {
            throw new Error("localiz_ar must receive a parent as a property of the config object.")
        }

        //---------------------PROVINCIAS--------------------------

        let element

        if (config.inputs?.provs instanceof Node) {
            if (config.inputs.provs.tagName.toLowerCase() === "select") {
                element = config.inputs.provs
            }
        }

        const prov = {
            select: element || document.createElement("select"),
            label: document.createElement("label"),
            loading_option: document.createElement("option")
        }
        let city = {}
        let street = {}
        let number = {}
        let floor = {}

        prov.select.className = "localiz_ar_provs localiz_ar_loading"
        prov.select.id = "localiz_ar_provs"

        prov.loading_option.textContent = "Cargando..."
        prov.select.appendChild(prov.loading_option)

        prov.label.textContent = config.labels?.provs || "Provincia:"
        prov.label.setAttribute("for", prov.select.id)

        if (!element) {
            if (!parent) {
                throw new Error("localiz.ar must receive either a prov input or a form parent")
            }
            parent.appendChild(prov.label)
            parent.appendChild(prov.select)
        }


        //-------------------------CIUDADES----------------------------------
        if (!config.exclude?.cities) {

            let element

            if (config.inputs?.cities instanceof Node) {
                if (config.inputs.cities.tagName.toLowerCase() === "input") {
                    element = config.inputs.cities
                }
            }

            city = {
                parent: element?.parentNode || document.createElement("div"),
                input: element || document.createElement("input"),
                label: document.createElement("label"),
                dropdown: document.createElement("div")
            }

            city.input.placeholder = config.placeholders?.cities || ""

            city.input.type = "text"

            city.parent.className = "localiz_ar_parent"
            city.input.className = "localiz_ar_cities localiz_ar_forbidden"
            city.dropdown.className = "localiz_ar_dropdown"

            city.input.readOnly = true
            city.input.id = "localiz_ar_cities"
            city.input.value = ""

            city.label.textContent = config.labels?.cities || "Ciudad:"
            city.label.setAttribute("for", city.input.id)

            city.parent.appendChild(city.dropdown)

            if (!element) {
                if (!parent) {
                    throw new Error("localiz.ar must receive either a city input or a form parent")
                }
                parent.appendChild(city.label)
                city.parent.appendChild(city.input)
                parent.appendChild(city.parent)
            }


            //------------------------CALLLES--------------------------
            if (!config.exclude?.streets) {

                let element

                if (config.inputs?.streets instanceof Node) {
                    if (config.inputs.streets.tagName.toLowerCase() === "input") {
                        element = config.inputs.streets
                    }
                }

                street = {
                    parent: element?.parentNode || document.createElement("div"),
                    input: element || document.createElement("input"),
                    label: document.createElement("label"),
                    dropdown: document.createElement("div")
                }

                street.input.placeholder = config.placeholders?.streets || ""

                street.input.type = "text"

                street.parent.className = "localiz_ar_parent"
                street.input.className = "localiz_ar_streets localiz_ar_forbidden"
                street.dropdown.className = "localiz_ar_dropdown"

                street.input.readOnly = true
                street.input.id = "localiz_ar_streets"
                street.input.value = ""

                street.label.textContent = config.labels?.streets || "Calle:"
                street.label.setAttribute("for", street.input.id)

                street.parent.appendChild(street.dropdown)

                if (!element) {
                    if (!parent) {
                        throw new Error("localiz.ar must receive either a street input or a form parent")
                    }
                    parent.appendChild(street.label)
                    street.parent.appendChild(street.input)
                    parent.appendChild(street.parent)
                }


                //--------------------NÚMERO------------------------------
                if (!config.exclude?.number) {

                    let element

                    if (config.inputs?.number instanceof Node) {
                        if (config.inputs.number.tagName.toLowerCase() === "input") {
                            element = config.inputs.number
                        }
                    }

                    number = {
                        input: element || document.createElement("input"),
                        label: document.createElement("label")
                    }

                    number.input.placeholder = config.placeholders?.number || ""

                    number.input.type = "number"

                    number.input.className = "localiz_ar_number localiz_ar_forbidden"

                    number.input.readOnly = true
                    number.input.id = "localiz_ar_number"
                    number.input.value = ""

                    number.label.textContent = config.labels?.number || "N°:"
                    number.label.setAttribute("for", number.input.id)

                    if (!element) {
                        if (!parent) {
                            throw new Error("localiz.ar must receive either a number input or a form parent")
                        }
                        parent.appendChild(number.label)
                        parent.appendChild(number.input)
                    }


                    //---------------PISO---------------------
                    if (!config.exclude?.floor) {

                        let element

                        if (config.inputs?.floor instanceof Node) {
                            if (config.inputs.floor.tagName.toLowerCase() === "input") {
                                element = config.inputs.floor
                            }
                        }

                        floor = {
                            input: element || document.createElement("input"),
                            label: document.createElement("label")
                        }

                        floor.input.placeholder = config.placeholders?.floor || ""

                        floor.input.type = "text"

                        floor.input.className = "localiz_ar_floor localiz_ar_forbidden"

                        floor.input.readOnly = true
                        floor.input.id = "localiz_ar_floor"
                        floor.input.value = ""

                        floor.label.textContent = config.labels?.floor || "Piso/Departamento:"
                        floor.label.setAttribute("for", floor.input.id)

                        if (!element) {
                            if (!parent) {
                                throw new Error("localiz.ar must receive either a floor input or a form parent")
                            }
                            parent.appendChild(floor.label)
                            parent.appendChild(floor.input)
                        }

                    }

                }

            }

        }

        if (!config.exclude?.license) {

            const license = document.createElement("p")
            license.innerHTML = `Data © OpenStreetMap contributors (<a href="https://opendatacommons.org/licenses/odbl/1.0/">ODbL</a>) and Servicio GeoRef – Instituto Geográfico Nacional (Argentina), modified (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>).`
            parent.appendChild(license)

        }

        const currentWeek = localiz_ar.getWeekVersion()

        const manifest = await fetch("https://cdn.jsdelivr.net/gh/santiagomirantes/localiz.ar-db/manifest.json?currentWeek=" + currentWeek)
        const { v } = await manifest.json()

        const base_url = `https://cdn.jsdelivr.net/gh/santiagomirantes/localiz.ar-db@${v}/dataset/`

        const req2 = await fetch(base_url + "provincias.json")
        const provs = await req2.json()

        prov.select.innerHTML = `<option value='null'>${config.placeholders?.provs || "Elija su provincia"}</option>`

        for (const [provID, provName] of provs) {
            const option = document.createElement("option")
            option.value = provID
            option.textContent = provName
            prov.select.appendChild(option)
        }

        let select_value
        let cities_options

        prov.select.addEventListener("change", async function () {

            prov.select.classList.remove("localiz_ar_error")
            select_value = this.value

            if (select_value === "null") {

                if (!config.exclude?.cities) {

                    city.input.className = "localiz_ar_cities localiz_ar_forbidden"
                    city.input.readOnly = true
                    city.input.value = ""

                    if (!config.exclude?.streets) {

                        street.input.className = "localiz_ar_streets localiz_ar_forbidden"
                        street.input.readOnly = true
                        street.input.value = ""

                        if (!config.exclude?.number) {

                            number.input.className = "localiz_ar_number localiz_ar_forbidden"
                            number.input.readOnly = true
                            number.input.value = ""

                            if (!config.exclude?.floor) {
                                floor.input.className = "localiz_ar_floor localiz_ar_forbidden"
                                floor.input.readOnly = true
                                floor.input.value = ""
                            }

                        }

                    }

                }

                return
            }


            if (!config.exclude?.cities) {

                city.input.className = "localiz_ar_cities localiz_ar_loading"
                city.input.readOnly = true
                city.input.value = "Cargando..."

                if (!config.exclude?.streets) {

                    street.input.className = "localiz_ar_streets localiz_ar_forbidden"
                    street.input.readOnly = true
                    street.input.value = ""

                    if (!config.exclude?.number) {

                        number.input.className = "localiz_ar_number localiz_ar_forbidden"
                        number.input.readOnly = true
                        number.input.value = ""

                        if (!config.exclude?.floor) {
                            floor.input.className = "localiz_ar_floor localiz_ar_forbidden"
                            floor.input.readOnly = true
                            floor.input.value = ""
                        }

                    }

                }

                const req = await fetch(base_url + select_value + "/ciudades.json")
                cities_options = await req.json()

                city.input.className = "localiz_ar_cities"
                city.input.readOnly = false
                city.input.value = ""

            }

        })

        let streets_options
        let streets_matches = []
        let streets_matchesList = {}

        if (!config.exclude?.cities) {

            let cities_matches = []
            let cities_matchesList = {}

            city.input.oninput = ev => {

                city.input.classList.remove("localiz_ar_error")

                if (city.input.value.trim() === "") {
                    cities_matches = []
                    cities_matchesList = {}
                    city.dropdown.innerHTML = ""
                    return
                }

                [cities_matches, cities_matchesList] = localiz_ar.get_matches(
                    city.input.value,
                    cities_options
                )

                localiz_ar.show_matches(
                    cities_matches,
                    cities_matchesList,
                    city.input,
                    city.dropdown,
                    cities_options,
                    config.max
                )
            }


            if (!config.exclude?.streets) {

                city.input.onblur = async ev => {

                    if (cities_matches.length > 0) {

                        if (!localiz_ar.localiz_ar_cities_focus) {
                            city.input.value = cities_options["_" + cities_matches[0][0]]
                            city.input.setAttribute("_id", cities_matches[0][0])
                            city.dropdown.innerHTML = ""
                        }

                        const id = city.input.getAttribute("_id")

                        street.input.className = "localiz_ar_streets localiz_ar_loading"
                        street.input.value = "Cargando..."

                        const req = await fetch(base_url + select_value + "/" + id + "/calles.json")
                        streets_options = await req.json()

                        street.input.value = ""
                        street.input.readOnly = false

                    } else {

                        city.input.removeAttribute("_id")
                        city.dropdown.innerHTML = ""

                        street.input.readOnly = true
                        street.input.value = ""
                        street.input.className = "localiz_ar_streets localiz_ar_forbidden"

                        if (!config.exclude?.number) {

                            number.input.readOnly = true
                            number.input.value = ""
                            number.input.className = "localiz_ar_number localiz_ar_forbidden"

                            if (!config.exclude?.floor) {
                                floor.input.readOnly = true
                                floor.input.value = ""
                                floor.input.className = "localiz_ar_floor localiz_ar_forbidden"
                            }

                        }

                    }
                }

            }

        }

        if (!config.exclude?.streets && !config.exclude?.cities) {

            street.input.oninput = ev => {

                street.input.classList.remove("localiz_ar_error")

                if (street.input.value.trim() === "") {
                    streets_matches = []
                    streets_matchesList = {}
                    street.dropdown.innerHTML = ""
                    return
                }

                ;[streets_matches, streets_matchesList] = localiz_ar.get_matches(
                    street.input.value,
                    streets_options
                )

                localiz_ar.show_matches(
                    streets_matches,
                    streets_matchesList,
                    street.input,
                    street.dropdown,
                    streets_options,
                    config.max
                )
            }

            street.input.onblur = ev => {

                if (streets_matches.length > 0) {

                    if (!localiz_ar.localiz_ar_streets_focus) {

                        street.input.value = streets_options["_" + streets_matches[0][0]]
                        street.input.setAttribute("_id", streets_matches[0][0])
                        street.dropdown.innerHTML = ""

                        if (!config.exclude?.number) {
                            number.input.className = "localiz_ar_number"
                            number.input.value = ""
                            number.input.readOnly = false
                        }
                    }

                } else {

                    street.input.removeAttribute("_id")
                    street.dropdown.innerHTML = ""

                    if (!config.exclude?.number) {

                        number.input.readOnly = true
                        number.input.value = ""
                        number.input.className = "localiz_ar_number localiz_ar_forbidden"

                        if (!config.exclude?.floor) {
                            floor.input.readOnly = true
                            floor.input.value = ""
                            floor.input.className = "localiz_ar_floor localiz_ar_forbidden"
                        }

                    }

                }
            }

        }

        if (!config.exclude?.number && !config.exclude?.streets && !config.exclude?.cities) {

            let number_value = ""

            number.input.oninput = () => {

                number.input.classList.remove("localiz_ar_error")

                const value = number.input.value.trim()

                if (value === "") {
                    number_value = ""
                    return
                }

                number_value = value
            }

            number.input.onblur = () => {

                if (number_value.length > 0) {

                    if (!config.exclude?.floor) {
                        floor.input.readOnly = false
                        floor.input.value = ""
                        floor.input.className = "localiz_ar_floor"
                    }

                }

                if (number_value.length === 0) {

                    if (!config.exclude?.floor) {
                        floor.input.readOnly = true
                        floor.input.value = ""
                        floor.input.className = "localiz_ar_floor localiz_ar_forbidden"
                    }

                }
            }
        }

        return {
            prov,
            city,
            street,
            number,
            floor
        }
    },

    validate(data = {}) {

        if (!data.prov) {
            throw new Error("localiz.ar: missing necessary data to validate the form.")
        }

        const prov_id = parseInt(
            data.prov.select.options[data.prov.select.selectedIndex].value
        )

        if (isNaN(prov_id)) {
            data.prov.select.classList.add("localiz_ar_error")
            throw new Error("No se ha especificado una provincia.")
        }

        let city_id

        if (data.city?.input) {

            city_id = parseInt(data.city.input.getAttribute("_id"))

            if (isNaN(city_id)) {
                data.city.input.classList.add("localiz_ar_error")
                throw new Error("No se ha especificado una ciudad.")
            }

        }

        let street_id

        if (data.street?.input) {

            street_id = parseInt(data.street.input.getAttribute("_id"))

            if (isNaN(street_id)) {
                data.street.input.classList.add("localiz_ar_error")
                throw new Error("No se ha especificado una calle.")
            }

        }

        let number

        if (data.number?.input) {

            number = parseInt(data.number.input.value)

            if (isNaN(number) || number < 0) {
                data.number.input.classList.add("localiz_ar_error")
                throw new Error("Numero de calle no válido.")
            }

        }

        let floor

        if (data.floor?.input) {

            //floor doesn´t require a strict check.
            floor = data.floor.input.value

        }

        return {
            prov_id,
            city_id,
            street_id,
            number,
            floor
        }

    }
}
