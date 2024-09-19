const { createClient } = supabase;
const SUPABASE_URI = "https://ndwpkcunrxyawpozuzlw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd3BrY3Vucnh5YXdwb3p1emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgzNzU4NzEsImV4cCI6MjAyMzk1MTg3MX0.afWLdX60_kJHUtmoujbJD7iMrZeSAOv2Jz1A4hpzfMM";
const _supabase = createClient(SUPABASE_URI, SUPABASE_KEY);

async function invokeSupabaseEdgeFunction(formData, form_id) {
    console.log(`Invoking supabase function: webhook-${form_id}`);

    const { data, error } = await _supabase.functions.invoke(`webhook-${form_id}`, {
        body: formData
    });

    if (error) {
        console.error('Error invoking supabase function: ', error);
        return;
    } else {
        console.log('Data from supabase function: ', data);
    }
}

function cleanAttributes(element, allowedAttributes) {
    const attributes = Array.from(element.attributes);

    attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
            element.removeAttribute(attr.name);
        }
    });
}

function linkForms() {
    const forms = document.querySelectorAll('[fx-form-submit-supabase]');
    
    forms.forEach(formElement => {
        console.log(`cleaning form attributes: ${formElement}`);

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();  // Prevent default form submission
            const formData = new FormData(formElement);  // Collect form data
            const form_id = formElement.getAttribute('fx-form-submit-supabase');
            // Invoke supabase function
            await invokeSupabaseEdgeFunction(formData, form_id).catch(console.error);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    linkForms();
});
