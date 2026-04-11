async function fn() {
    const data = await localiz_ar.start({
        parent:document.querySelector("#localiz_ar"),
        filter:{
            streets:{
            }
        }
    })
    const result = document.querySelector("#result code")
    document.querySelector("#submit").onclick = ev => {
        try {
            ev.preventDefault()
            const validation = localiz_ar.validate(data)
            result.innerHTML = `//RESULTADO\n\n${JSON.stringify(validation)}`
            
        }
        catch (err) {
            result.innerHTML = `//RESULTADO\n\n"${err.message}"`
        }
        Prism.highlightAll()
    }

}

fn()