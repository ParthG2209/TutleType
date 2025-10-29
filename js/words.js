// Word database - common English words
const WORD_LIST = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
    "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
    "is", "was", "are", "been", "has", "had", "were", "said", "did", "having",
    "may", "should", "could", "might", "must", "shall", "can", "will", "would", "being",
    "find", "give", "tell", "ask", "work", "seem", "feel", "try", "leave", "call",
    "hand", "eye", "face", "place", "door", "house", "world", "school", "state", "family",
    "student", "group", "country", "problem", "fact", "week", "company", "system", "program", "question",
    "right", "number", "point", "home", "water", "room", "mother", "area", "money", "story",
    "young", "book", "word", "business", "issue", "side", "kind", "head", "house", "service",
    "friend", "father", "power", "hour", "game", "line", "end", "member", "law", "car",
    "city", "community", "name", "president", "team", "minute", "idea", "kid", "body", "information",
    "nothing", "ago", "right", "lead", "social", "understand", "whether", "back", "watch", "follow",
    "around", "parent", "only", "stop", "face", "anything", "create", "public", "already", "speak",
    "others", "read", "level", "allow", "add", "office", "spend", "door", "health", "person",
    "art", "sure", "such", "war", "history", "party", "within", "grow", "result", "open",
    "change", "morning", "walk", "reason", "low", "win", "research", "girl", "guy", "early",
    "food", "before", "moment", "himself", "air", "teacher", "force", "offer", "enough", "both",
    "across", "although", "remember", "foot", "second", "boy", "maybe", "toward", "able", "age",
    "policy", "everything", "love", "process", "music", "including", "consider", "appear", "actually", "buy",
    "probably", "human", "wait", "serve", "market", "die", "send", "expect", "home", "sense",
    "build", "stay", "fall", "nation", "plan", "cut", "college", "interest", "death", "course",
    "someone", "experience", "behind", "reach", "local", "kill", "six", "remain", "effect", "use"
];

// Function to generate random words
function generateWords(count = 100) {
    const words = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
        words.push(WORD_LIST[randomIndex]);
    }
    return words;
}
