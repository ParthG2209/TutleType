// ============ SENSITIVE WORDS FILTER ============
const SENSITIVE_WORDS = [
    'kill', 'killed', 'killing', 'dies', 'died', 'death', 'die', 'dying', 'rape', 'raped', 
    'drugs', 'drug', 'cocaine', 'heroin', 'meth', 'cannabis', 'weed', 'marijuana', 'acid', 
    'lsd', 'ecstasy', 'mdma', 'gun', 'guns', 'shoot', 'shooting', 'bomb', 'bombing', 'terrorist',
    'terrorism', 'suicide', 'suicidal', 'sex', 'porn', 'xxx', 'fuck', 'shit', 'damn', 'hell',
    'bitch', 'asshole', 'whore', 'slut', 'faggot', 'nigger', 'hate', 'hated', 'murder', 
    'murdered', 'genocide', 'brutal', 'violence', 'violent', 'torture', 'abused', 'predator'
];

function containsSensitiveWord(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => {
        const cleanWord = word.replace(/[.,!?;:'"—–-]/g, '');
        return SENSITIVE_WORDS.includes(cleanWord);
    });
}

// ============ SENTENCES FROM REAL BOOKS & MOVIES ============
const SENTENCES = [
    // Pride and Prejudice
    "It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife.",
    "The married state is certainly one in which happiness is most generally found.",
    "I could have married anyone but I chose to marry for love.",
    "Elizabeth felt all the justice of his affection and respect.",
    "There is nothing in which deception so easily practiced as through books.",
    
    // Great Gatsby
    "In my younger and more vulnerable years my father gave me advice that I have been turning over in my mind ever since.",
    "Whenever you feel like criticizing anyone just remember that all the people in this world have not had the advantages that you have had.",
    "So we beat on boats against the current borne back ceaselessly into the past.",
    "The only way to deal with an unfree world is to become so absolutely free that very existence of that world is a form of your freedom.",
    "I like to walk up Fifth Avenue and pick out romantic women from the crowd.",
    
    // Jane Eyre
    "There was no possibility of taking a walk that day.",
    "I am no bird and no net ensnares me I am a free human being with an independent will.",
    "I would always rather be happy than dignified.",
    "Do you think I am an automaton without feelings and can bear to have my morsel of bread snatched from my lips.",
    "I am not talking to you now through the medium of custom conventionalities nor even of mortal flesh.",
    
    // Alice in Wonderland
    "Alice was beginning to get very tired of sitting by her sister on the bank and of having nothing to do.",
    "What is the use of a book without pictures or conversations.",
    "It would be fun to pretend there is a way of getting through into it somehow.",
    "Everything is funny if you can laugh at it.",
    "If you don't know where you are going any road will get you there.",
    
    // Sherlock Holmes
    "To Sherlock Holmes she is always the woman.",
    "It is a capital mistake to theorize before one has data.",
    "Elementary my dear Watson it is not difficult when you know how.",
    "The game is afoot.",
    "I have nothing to do today except to avoid boredom.",
    
    // Moby Dick
    "Call me Ishmael.",
    "Some years ago never mind how long precisely having little or no money in my purse and nothing particular to interest me on shore I thought I would sail about a little and see the watery part of the world.",
    "It is a way I have of driving off the spleen and regulating the circulation.",
    "There is something in a voyage that overhauls the entire routine of ones existence.",
    "Better to sleep with a sober cannibal than a drunken Christian.",
    
    // Forrest Gump
    "My mama always said life was like a box of chocolates you never know what you are gonna get.",
    "I have been running for three years two months and two days.",
    "Stupid is as stupid does.",
    "I wish I could have been there with you.",
    "The most important thing is you got to make it count.",
    
    // The Matrix
    "What is real how do you define real if you are talking about what you can feel what you can smell what you can taste and see then real is simply electrical signals interpreted by your brain.",
    "There is no spoon.",
    "The Matrix is a system Neo.",
    "You have to let it all go Neo fear doubt disbelief.",
    "What are you waiting for the most?",
    
    // Inception
    "What is the most resilient parasite an idea.",
    "A dream within a dream.",
    "Once an idea has taken hold of your brain it is almost impossible to eradicate.",
    "The idea can change everything.",
    "You create the world of the dream you bring the subjects into that dream and more importantly you are the law of that world.",
    
    // Shawshank Redemption
    "Get busy living or get busy dying that is the choice we all have.",
    "Hope is a dangerous thing.",
    "Some birds are not meant to be caged.",
    "I guess it comes down to a simple choice really.",
    "The funny thing is on the outside I was an honest man straight as an arrow.",
    
    // Fight Club
    "You are not your job you are not how much money you have in the bank.",
    "The first rule of fight club is you do not talk about fight club.",
    "It is only after we have lost everything that we are free to do anything.",
    "We are the middle children of history with no purpose or place.",
    "The things you own end up owning you.",
    
    // Tale of Two Cities
    "It was the best of times it was the worst of times.",
    "It was the age of wisdom it was the age of foolishness.",
    "It was the spring of hope it was the winter of despair.",
    "A Tale of Two Cities is set in the year one thousand seven hundred and seventy five.",
    "The human heart is the most precious thing we possess.",
    
    // Twenty Thousand Leagues
    "The sea is everything.",
    "It covers seven tenths of the terrestrial globe.",
    "Its breath is pure and healthy.",
    "The sea holds all the secrets of the deep.",
    "I have found freedom in these waters.",
    
    // Lord of the Rings
    "All we have to decide is what to do with the time that is given to us.",
    "Not all those who wander are lost.",
    "There is some good in this world and it is worth fighting for.",
    "I wish it need not have happened in my time said Frodo.",
    "One does not simply walk into Mordor.",
];

// ============ SHUFFLE FUNCTION ============
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============ GENERATE WORDS FROM SHUFFLED SENTENCES ============
function generateWords(count = 1000) {
    const shuffledSentences = shuffleArray(SENTENCES);
    const words = [];
    let sentenceIndex = 0;

    while (words.length < count) {
        // Get current sentence and loop back if needed
        const sentence = shuffledSentences[sentenceIndex % shuffledSentences.length];
        
        // Skip if sentence contains sensitive words
        if (containsSensitiveWord(sentence)) {
            sentenceIndex++;
            continue;
        }

        // Split sentence into words and clean them
        const sentenceWords = sentence
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[.,!?;:'"—–-]/g, ''))
            .filter(word => word.length > 0);

        // Add words to result
        for (const word of sentenceWords) {
            if (words.length >= count) break;
            if (word.length >= 2) {
                words.push(word);
            }
        }

        sentenceIndex++;
    }

    return words.slice(0, count);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateWords };
}
