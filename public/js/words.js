// ============ SENSITIVE WORDS FILTER ============
const SENSITIVE_WORDS = [
    'kill', 'died', 'death', 'die', 'dying', 'rape', 'raped', 'drugs', 'drug', 'cocaine', 
    'heroin', 'meth', 'cannabis', 'weed', 'marijuana', 'acid', 'lsd', 'ecstasy', 'mdma',
    'gun', 'guns', 'shoot', 'shooting', 'bomb', 'bombing', 'terrorist', 'terrorism',
    'suicide', 'suicidal', 'sex', 'porn', 'xxx', 'fuck', 'shit', 'damn', 'hell',
    'bitch', 'ass', 'asshole', 'cunt', 'piss', 'whore', 'slut', 'faggot', 'nigger',
    'hate', 'hated', 'hating', 'murder', 'murdered', 'murdering', 'genocide', 'brutal',
    'violence', 'violent', 'torture', 'tortured', 'rape', 'abused', 'abuse', 'predator',
    'child', 'children', 'kid', 'kids', 'boy', 'girl', 'minor'
];

function containsSensitiveWord(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => {
        // Remove punctuation for comparison
        const cleanWord = word.replace(/[.,!?;:'"]/g, '');
        return SENSITIVE_WORDS.includes(cleanWord);
    });
}

// ============ TEXT SOURCES ============
const TEXT_SOURCES = {
    // BOOKS
    'pride-and-prejudice': `It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters. My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last? Mr. Bennet replied that he had not. You must know, that Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it that he agreed with Mr. Morris immediately. That he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week.`,

    'great-gatsby': `In my younger and more vulnerable years my father gave me advice that I have been turning over in my mind ever since. Whenever you feel like criticizing any one, he told me, just remember that all the people in this world have not had the advantages that you have had. He did not say any more, but we have always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I am inclined to reserve all judgments, a habit that has opened up many curious natures to me.`,

    'jane-eyre': `There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since the afternoon had grown dark and cold, a violent wind had risen and driven all the clouds from their positions. I heard it howling in the gutters. My heart beat thick with running, and I felt every vein in my body throbbing. Our natures dovetail, do they not? To the finest fibre of my own heart.`,

    'wuthering-heights': `The name of the action-house was Thrushcross Grange. Mr. Hindley had brought home a new instrument of torture from the city the day before yesterday. It was a large dog; and though it had not come as a gift, there seemed to be a compact between him and his master. When Mr. Hindley came home, he always brought bad news; and now something had happened which was worse than usual bad news.`,

    'little-women': `It is Christmas time again. The snow lies white upon the streets of our little town. The church bells are ringing for morning service, and all the world is merry and bright. The Marches are preparing for the holidays. Marmee bustles about the house, arranging flowers and hanging green garland over the doors. Meg and Jo are busy in the sitting room, preparing decorations from evergreen boughs and bright ribbons.`,

    'alice-wonderland': `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it. And what is the use of a book, thought Alice without pictures or conversations. So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies.`,

    'sherlock-holmes': `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has ever produced.`,

    // MOVIES
    'forrest-gump': `My mama always said life was like a box of chocolates, you never know what you are gonna get. I have been running for three years, two months, and two days. I sometimes think I should have run westward as well, just to see what I would have seen. Stupid is as stupid does. Mama always said they matched up the pink sheets with the pink lids, and the white sheets with the white lids.`,

    'pulp-fiction': `Do you ever look at someone and wonder what is going on inside their head? I mean really wonder what they are thinking about? Are they thinking about their job, their family, the weather? Do they have secrets that nobody knows about? Sometimes I think people are putting on a show, like we are all just acting out our parts. The world is a stage, and we are all merely players in this great production of life.`,

    'inception': `What is the most resilient parasite? Bacteria? A virus? An intestinal worm? No. Implanted a person's head is something far more dangerous: an idea. Ideas are the most powerful things in the world. They can define us, destroy us, or save us. Once an idea has taken hold of your mind, it becomes difficult to escape. That is the power and the danger of ideas. They are more powerful than any weapon.`,

    'the-matrix': `What is the Matrix? It is a system, Neo. The system is our enemy. But when you are inside, you look around and what do you see? Businessmen, teachers, lawyers, carpenters. The very minds of the people we are trying to save. But until we do, these people are still a part of that system, and that makes them our enemy. You have to understand, most people are not ready to be unplugged.`,

    'shawshank': `Get busy living or get busy dying. That is the choice we all have. Every man has an idea of what freedom means to him. For some, it is the ability to walk in the sunshine. For others, it is the ability to make choices about their own life. Freedom is not something that is given to you. It is something that you must take for yourself.`,

    'fight-club': `You are not your job. You are not how much money you have in the bank. You are not the car you drive. You are not the contents of your wallet. You are not your khakis. You are the all-singing, all-dancing crap of the world. It is only after we have lost everything that we are free to do anything. We are the middle children of history. No purpose or place.`,

    // MORE NOVELS
    'moby-dick': `Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth, whenever it is a damp, drizzly November in my soul, I account it high time to get to sea as soon as I can.`,

    'pride-prejudice-2': `Elizabeth Bennet had always prided herself on knowing her own mind. She was not one to be swayed by the opinions of others or by the expectations of society. Her mother, Mrs. Bennet, was constantly trying to arrange advantageous matches for her daughters, but Elizabeth had determined that she would only marry for love and mutual respect. The world might not understand her convictions, but she remained steadfast in her determination to live according to her own principles.`,

    'tale-of-two-cities': `It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness. It was the spring of hope, it was the winter of despair. We had everything before us, we had nothing before us, we were all going direct to heaven, we were all going direct the other way.`,

    'twenty-thousand-leagues': `The sea is everything. It covers seven tenths of the terrestrial globe. Its breath is pure and healthy. It is an immense desert, where man is never lonely, for he feels life stirring on all sides. The sea is the vast reservoir of nature. The sea is movement and immensity, the sea is all that is magnificent and wondrous. Who has not learned to admire the sea and all its mysteries? The ocean holds more secrets than any other place on earth.`,

    'island-treasure': `The worst of us are not in the least savages. The best of us are not exactly angels. In between, we humans muddle through with a mixture of good intentions and questionable actions. Every person has within them both light and darkness. The sea calls to those with adventurous spirits. Fortune and adventure await those brave enough to seek them.`,

    'cranford': `In the first place, Cranford is in possession of the Amazons. All the holders of houses above a certain rent are women. If a married couple come to settle in the town, somehow the gentleman disappears. He is either dead or he is submerged in the things that are called county business. The ladies of Cranford know each other by character. We are all quite content to see each other, and hear each other. And in this peaceful way, we continue on.`
};

// ============ WORD GENERATOR WITH FILTERING ============
function generateWords(count = 1000) {
    const allSources = Object.values(TEXT_SOURCES);
    const words = [];
    let sourceIndex = 0;

    while (words.length < count) {
        const source = allSources[sourceIndex % allSources.length];
        const sourceWords = source
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[.,!?;:'"—–-]/g, ''))
            .filter(word => word.length > 0);

        for (const word of sourceWords) {
            if (words.length >= count) break;
            
            // Check if word or phrase is safe
            if (!containsSensitiveWord(word) && word.length >= 2) {
                words.push(word);
            }
        }

        sourceIndex++;
    }

    return words.slice(0, count);
}

// ============ EXPORT ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateWords };
}
