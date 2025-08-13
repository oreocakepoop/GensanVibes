// data/icons.ts

const ICON_BASE_URL = 'https://img.icons8.com/?size=100&format=png';

// To customize an icon, find its name below and replace the 'id' and 'color'.
// You can get the ID from the Icons8 URL.
// Colors are hex codes without the '#'.
const ICONS_CONFIG = {
    // General UI
    search: { id: '132', color: '776B5D' },
    home: { id: 'H445aZavLORa', color: '776B5D' },
    homeActive: { id: 'H445aZavLORa', color: 'DCA278' },
    compass: { id: '8nuV4NCLvvFw', color: '776B5D' },
    compassActive: { id: '8nuV4NCLvvFw', color: 'DCA278' },
    food: { id: 'P5m9DByJbMTO', color: '776B5D' },
    foodActive: { id: 'P5m9DByJbMTO', color: 'DCA278' },
    bell: { id: 'WL8WaVFrcc3N', color: '776B5D' },
    bellActive: { id: 'WL8WaVFrcc3N', color: 'DCA278' },
    bellLarge: { id: '12400', color: 'CDD4B1' },
    user: { id: '7A9mvMVA1okN', color: '776B5D' },
    signOut: { id: 'LYzWbTKzKcac', color: 'DCA278' },
    pencil: { id: '36929', color: '776B5D' },
    arrowLeft: { id: '115839', color: '473C33' },
    close: { id: 'VaHFapP3XCAj', color: '776B5D' },
    refresh: { id: '102312', color: 'FFF9E2' },
    editPencil: { id: '118958', color: 'FFF9E2' },
    moreOptions: { id: '36944', color: '776B5D' },
    trash: { id: '102315', color: 'DCA278' },
    lock: { id: '83109', color: '776B5D' },

    // Post Types
    text: { id: 'J4PHJHDoge8I', color: '776B5D' },
    photo: { id: 'yXtRR6kMOwOn', color: '776B5D' },
    quote: { id: '480QZ1z7xYDd', color: '776B5D' },
    link: { id: '48525', color: '776B5D' },
    chat: { id: 'nAYBbBeAokn3', color: '776B5D' },
    audio: { id: 'tUvBXbyLhrka', color: '776B5D' },
    video: { id: 'NXHvMKC24zGN', color: '776B5D' },
    
    // Interactions
    reply: { id: 'LrNkCnokfv0c', color: '776B5D' }, // using chat icon
    repost: { id: '2DgnkixtoLqa', color: '776B5D' },
    like: { id: 'sGQrCz1ti5x7', color: '776B5D' },
    likeActive: { id: 'sGQrCz1ti5x7', color: 'DCA278' },
    thumbsUp: { id: '2744', color: '776B5D' },
    thumbsUpActive: { id: '2744', color: 'DCA278' },
    send: { id: 'pgOrw8mWHUn2', color: '776B5D' },
    chatBubble: { id: 'Khf81eSD686C', color: 'FFF9E2' },
    commentLarge: { id: 'w5b24S0k5VQI', color: '776B5D' },

    // Events
    calendar: { id: 'j2ni1obs6Lrh', color: '776B5D' },
    calendarActive: { id: 'j2ni1obs6Lrh', color: 'DCA278' },
    calendarLarge: { id: 'j2ni1obs6Lrh', color: 'CDD4B1' },
    addEvent: { id: '37979', color: 'FFF9E2' },
    pin: { id: 'R9Ua0akh4ksZ', color: '776B5D' },
    clock: { id: '10083', color: '776B5D' },
    group: { id: 'Khf81eSD686C', color: '776B5D' },

    // DM Icons
    dm: { id: 'OPxnEZsfV5iT', color: '776B5D' },
    dmActive: { id: 'OPxnEZsfV5iT', color: 'DCA278' },
    dmLarge: { id: 'OPxnEZsfV5iT', color: 'CDD4B1' },

    // Badges
    badgeDefault: { id: 'HFacTvMKpoSL', color: 'CDD4B1' }, // Default placeholder
    firstVibe: { id: 'iMOL8BuPplly', color: 'DCA278' },
    wordWeaver: { id: 'ZnW8tegdQkcB', color: '473C33' },
    tunaCapitalTitan: { id: '70452', color: '473C33' },
    socialButterfly: { id: 'xUA1TBkW16LW', color: 'DCA278' },
    peoplePerson: { id: '3gnTCfSJXRyt', color: 'DCA278' },
    localViber: { id: '8_YULh6oHPbc', color: 'DCA278' },
    commentConnoisseur: { id: 'iuTebHTZlLhS', color: '473C33' },
    chikaChampion: { id: '82386', color: 'DCA278' },
    eventEnthusiast: { id: 'AQhqdZH2QqIE', color: 'DCA278' },
    theExplorer: { id: 'tdUhWTMHpZ5a', color: '473C33' },
};

type IconName = keyof typeof ICONS_CONFIG;

// This part automatically builds the full URLs. You don't need to touch it.
export const iconUrls = Object.entries(ICONS_CONFIG).reduce((acc, [name, config]) => {
    acc[name as IconName] = `${ICON_BASE_URL}&id=${config.id}&color=${config.color}`;
    return acc;
}, {} as Record<IconName, string>);