/**
 * Language-to-Agent routing for RaktSetu.
 * 
 * Each supported language gets its own Ringg agent (or shares one with secondary_language).
 * At call time, we pick the right agent based on donor's preferred language.
 * 
 * To add a new language:
 * 1. Create agent on Ringg dashboard (or via API)
 * 2. Add entry to AGENTS below with the agent_id
 */

const AGENTS = {
  "hi-IN": {
    agent_id: process.env.RINGG_AGENT_ID_HINDI || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Hindi",
    primary: "hi-IN",
    secondary: "en-IN",
    intro: "Namaste @{{callee_name}} ji, main RaktSetu se bol raha hoon. Ek emergency blood request aayi hai — @{{hospital_name}} mein @{{blood_group}} blood ki zaroorat hai. Kya aap agle 2 ghante mein donate kar sakte hain?",
  },
  "en-IN": {
    agent_id: process.env.RINGG_AGENT_ID_ENGLISH || process.env.RINGG_AGENT_ID,
    name: "RaktSetu English",
    primary: "en-IN",
    secondary: "hi-IN",
    intro: "Hi @{{callee_name}}, this is RaktSetu calling about an emergency. @{{hospital_name}} urgently needs @{{blood_group}} blood. Are you available to donate within the next 2 hours?",
  },
  "ta-IN": {
    agent_id: process.env.RINGG_AGENT_ID_TAMIL || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Tamil",
    primary: "ta-IN",
    secondary: "en-IN",
    intro: "Vanakkam @{{callee_name}}, naan RaktSetu-lerindhu pesugireen. @{{hospital_name}}-la @{{blood_group}} ratham urgent-aa thevai. Neenga 2 mani neram-la donate panna mudiyuma?",
  },
  "te-IN": {
    agent_id: process.env.RINGG_AGENT_ID_TELUGU || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Telugu",
    primary: "te-IN",
    secondary: "en-IN",
    intro: "Namaskaram @{{callee_name}} garu, nenu RaktSetu nundi call chestunnanu. @{{hospital_name}} lo @{{blood_group}} blood emergency ga kavali. Meeru 2 hours lo donate cheyagalara?",
  },
  "kn-IN": {
    agent_id: process.env.RINGG_AGENT_ID_KANNADA || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Kannada",
    primary: "kn-IN",
    secondary: "en-IN",
    intro: "Namaskara @{{callee_name}}, naanu RaktSetu inda call maadtiddini. @{{hospital_name}} alli @{{blood_group}} rakta urgent aagi beku. Neevu 2 ghante olage donate maadakke aagutta?",
  },
  "bn-IN": {
    agent_id: process.env.RINGG_AGENT_ID_BENGALI || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Bengali",
    primary: "bn-IN",
    secondary: "en-IN",
    intro: "Nomoshkar @{{callee_name}}, ami RaktSetu theke bolchi. @{{hospital_name}}-e @{{blood_group}} rokto jomoti dorkar. Apni ki 2 ghontar modhye donate korte parben?",
  },
  "mr-IN": {
    agent_id: process.env.RINGG_AGENT_ID_MARATHI || process.env.RINGG_AGENT_ID,
    name: "RaktSetu Marathi",
    primary: "mr-IN",
    secondary: "en-IN",
    intro: "Namaskar @{{callee_name}}, mi RaktSetu madhun call karat aahe. @{{hospital_name}} madhe @{{blood_group}} blood chi tatkal garaj aahe. Tumhi 2 taasaat donate karu shakta ka?",
  },
};

// Default when we don't know the donor's language
const DEFAULT_LANGUAGE = "en-IN";

/**
 * Get the right agent config for a donor's preferred language.
 * Falls back to Hindi if language not configured.
 */
function getAgentForLanguage(language) {
  return AGENTS[language] || AGENTS[DEFAULT_LANGUAGE];
}

/**
 * Get agent_id for a donor's language.
 */
function getAgentId(language) {
  return getAgentForLanguage(language).agent_id;
}

/**
 * Map state/region to default language (used when donor hasn't set preference).
 */
const STATE_LANGUAGE_MAP = {
  // Hindi belt
  "uttar pradesh": "hi-IN", "bihar": "hi-IN", "madhya pradesh": "hi-IN",
  "rajasthan": "hi-IN", "jharkhand": "hi-IN", "chhattisgarh": "hi-IN",
  "uttarakhand": "hi-IN", "haryana": "hi-IN", "delhi": "hi-IN",
  "himachal pradesh": "hi-IN",
  // South
  "tamil nadu": "ta-IN", "karnataka": "kn-IN",
  "andhra pradesh": "te-IN", "telangana": "te-IN",
  // East
  "west bengal": "bn-IN", "tripura": "bn-IN",
  // West
  "maharashtra": "mr-IN", "goa": "mr-IN",
  // Default for others
  "punjab": "hi-IN", "gujarat": "hi-IN", "odisha": "hi-IN",
  "kerala": "en-IN", "assam": "en-IN",
};

function getLanguageForState(state) {
  return STATE_LANGUAGE_MAP[state?.toLowerCase()] || DEFAULT_LANGUAGE;
}

module.exports = { AGENTS, getAgentForLanguage, getAgentId, getLanguageForState, DEFAULT_LANGUAGE };
