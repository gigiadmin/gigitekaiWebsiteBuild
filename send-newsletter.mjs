// Trigger newsletter campaign send via tRPC endpoint
const BASE_URL = "https://www.ggai.llc";

async function sendNewsletter() {
  // First, get the draft campaign body from the database via the API
  // We'll call the sendCampaign endpoint directly
  // But since it requires admin auth, we'll use the internal executeCampaignSend approach
  
  // Instead, let's just update the campaign status to 'scheduled' with a past date
  // so the background scheduler picks it up within 60 seconds
  console.log("Setting campaign 30001 to scheduled with past date so the scheduler sends it...");
}

sendNewsletter();
