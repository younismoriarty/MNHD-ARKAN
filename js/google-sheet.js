const SCRIPT_URL = "ضع رابط Apps Script هنا";

function getParam(name){

    return new URLSearchParams(window.location.search).get(name) || "";

}

async function handleContactFormGS(e){

    e.preventDefault();

    const form = e.target;

    const btn = form.querySelector("button");

    btn.disabled = true;

    btn.innerText = "جارى الإرسال...";

    const data = {

        name: form.name.value,

        phone: form.phone.value,

        project: form.project ? form.project.value : "",

        page: window.location.pathname,

        gclid: getParam("gclid"),

        utm_source: getParam("utm_source"),

        utm_medium: getParam("utm_medium"),

        utm_campaign: getParam("utm_campaign"),

        utm_term: getParam("utm_term"),

        utm_content: getParam("utm_content")

    };

    try{

        await fetch(SCRIPT_URL,{

            method:"POST",

            body:JSON.stringify(data)

        });

        window.location.href="thankyou.html";

    }

    catch(err){

        alert("حدث خطأ أثناء الإرسال");

        btn.disabled=false;

        btn.innerText="إرسال";

    }

}
