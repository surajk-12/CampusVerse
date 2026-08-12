import axios from "axios";

async function getFreeModels() {
  try {
    const res = await axios.get("https://openrouter.ai/api/v1/models");
    const models = res.data.data || [];
    
    // Filter models where prompt and completion costs are 0
    const freeModels = models.filter(m => {
      const prompt = parseFloat(m.pricing?.prompt || "0");
      const completion = parseFloat(m.pricing?.completion || "0");
      return prompt === 0 && completion === 0;
    });

    console.log("Found free models:");
    freeModels.forEach(m => {
      console.log(`- ID: ${m.id} | Name: ${m.name}`);
    });
  } catch (error) {
    console.error("Error fetching models:", error.message);
  }
}

getFreeModels();
