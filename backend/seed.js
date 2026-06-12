import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { uploadToCloudinary } from './config/cloudinary.js';

import Artifact from './models/Artifact.js';
import Exhibition from './models/Exhibition.js';
import Story from './models/Story.js';
import Trail from './models/Trail.js';
import Guide from './models/Guide.js';
import Admin from './models/Admin.js';
import Booking from './models/Booking.js';
import Message from './models/Message.js';
import Survey from './models/Survey.js';
import AccessCode from './models/AccessCode.js';
import AnalyticsEvent from './models/AnalyticsEvent.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS = path.join(__dirname, '..', 'frontend', 'src', 'assets');

const uploadImage = async (filename) => {
  const filePath = path.join(ASSETS, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Image not found: ${filename}, skipping...`);
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  const result = await uploadToCloudinary(buffer, { folder: 'museum/artifacts' });
  console.log(`  ✓ Uploaded: ${filename}`);
  return result.url;
};

const importData = async () => {
  try {
    console.log('\n🗑  Clearing existing data...');
    await Promise.all([
      Artifact.deleteMany(), Exhibition.deleteMany(), Story.deleteMany(),
      Trail.deleteMany(), Guide.deleteMany(), Admin.deleteMany(),
      Booking.deleteMany(), Message.deleteMany(), Survey.deleteMany(),
      AccessCode.deleteMany(), AnalyticsEvent.deleteMany(),
    ]);

    // ══════════════════════════════════════════════════
    // ── Upload images to Cloudinary ──
    // ══════════════════════════════════════════════════
    console.log('\n📤 Uploading images to Cloudinary...');

    // CORRECT IMAGE MAPPING (verified visually):
    // image (1).jpeg  = Nile Crocodile (open mouth, on grass near museum wall)
    // image (2).jpeg  = Rwandan Crafts Collection (shelves with Agaseke baskets, Imigongo art)
    // image (4).jpeg  = Statue of Richard Kandt (front view, golden bronze statue)
    // image (5).jpeg  = AR Smart Tourism Scanner (visitor scanning QR code at museum entrance)
    // image (6).jpeg  = Statue of Richard Kandt (rear view, with Rwandan flag)
    // image (7).jpeg  = Portrait of Richard Kandt (historical B&W photograph, 1897)
    // image (8).jpeg  = Colonial-Era Industrial Wheel (old metal wheel by turquoise window)
    // image (9).jpeg  = Black Mamba Specimen (preserved snake in glass display case)
    // image (10).jpeg = Kandt's Writing Desk (wooden desk and chair by stone fireplace)
    // image (11).jpeg = Kandt House Museum Building (side view, pink walls, turquoise windows)
    // image (12).jpeg = Historical Photographs (high-jump competition photos on museum walls)
    // image (13).jpeg = Nile Crocodile (second view, resting in brick enclosure)
    // image (14).jpeg = Gaboon Viper Specimen (close-up of geometric patterned snake)
    // HomeCt.jpeg     = Kandt House Museum Building (front entrance view, pink with steps)

    const [
      imgCrocodile1, imgCrafts, imgKandtStatueFront, imgARScanner,
      imgKandtStatueRear, imgKandtPortrait, imgColonialWheel, imgBlackMamba,
      imgKandtDesk, imgMuseumSide, imgHistoricalPhotos, imgCrocodile2,
      imgGaboonViper, imgMuseumFront,
    ] = await Promise.all([
      uploadImage('image (1).jpeg'),   // Crocodile open mouth
      uploadImage('image (2).jpeg'),   // Crafts shelves
      uploadImage('image (4).jpeg'),   // Kandt statue front
      uploadImage('image (5).jpeg'),   // AR scanner
      uploadImage('image (6).jpeg'),   // Kandt statue rear
      uploadImage('image (7).jpeg'),   // Kandt portrait B&W
      uploadImage('image (8).jpeg'),   // Colonial wheel
      uploadImage('image (9).jpeg'),   // Black Mamba
      uploadImage('image (10).jpeg'),  // Kandt desk
      uploadImage('image (11).jpeg'),  // Museum side view
      uploadImage('image (12).jpeg'),  // Historical photos
      uploadImage('image (13).jpeg'),  // Crocodile in enclosure
      uploadImage('image (14).jpeg'),  // Gaboon Viper
      uploadImage('HomeCt.jpeg'),      // Museum front entrance
    ]);

    // ── 1. Admin Accounts ──
    console.log('\n👤 Creating admin accounts...');
    const adminUser = await Admin.create({
      username: 'admin', email: 'admin@museum.rw', password: 'Admin@2026!',
      role: 'admin', isProtected: true,
      profile: { firstName: 'Museum', lastName: 'Administrator' },
    });

    const guideAccount = await Admin.create({
      username: 'jeanpaul', email: 'jean@museum.rw', password: 'Guide@2026!',
      role: 'guide',
      profile: { firstName: 'Jean', lastName: 'Paul' },
    });

    // ═══════════════════════════════════════════════════════════════
    // ── 2. Create Artifacts (with correct images) ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏺 Creating artifacts...');

    const kandtStatue = await Artifact.create({
      name: {
        en: 'Statue of Richard Kandt',
        fr: 'Statue de Richard Kandt',
        rw: 'Igishushanyo cya Richard Kandt',
      },
      description: {
        en: 'A golden bronze statue of Dr. Richard Kandt standing at the entrance of the museum grounds. The statue depicts Kandt in his explorer\'s attire, holding his hat, looking out over the city he founded.',
        fr: 'Une statue en bronze doré du Dr Richard Kandt se dressant à l\'entrée du musée. La statue représente Kandt dans sa tenue d\'explorateur, tenant son chapeau.',
        rw: 'Igishushanyo cy\'umuringa w\'izahabu cya Dr. Richard Kandt gihagarara ku muryango w\'inzu ndangamurage. Kigaragaza Kandt mu mwambaro we w\'umushakashatsi, afashe ingofero ye.',
      },
      historicalStory: {
        en: 'Richard Kandt (born Richard Kantorowicz, 1867–1918) was a German physician, poet, and explorer who arrived in East Africa in 1897 searching for the source of the Nile. He identified the Rukarara River in southwestern Rwanda as the most distant headwater of the Nile. In 1907, he was appointed the first Imperial Resident of Rwanda by the German colonial government and chose Kigali — then a small hilltop settlement — as his administrative base, effectively founding what would become Rwanda\'s capital city. This statue was erected to commemorate his pivotal role in Kigali\'s origins.',
        fr: 'Richard Kandt (né Richard Kantorowicz, 1867–1918) était un médecin, poète et explorateur allemand arrivé en Afrique de l\'Est en 1897 à la recherche de la source du Nil. Il a identifié la rivière Rukarara comme la source la plus éloignée du Nil. En 1907, il fut nommé premier Résident impérial du Rwanda et choisit Kigali comme base administrative, fondant ainsi la future capitale.',
        rw: 'Richard Kandt (wavutse ari Richard Kantorowicz, 1867–1918) yari umuganga, umwanditsi w\'imivugo n\'umushakashatsi w\'Ubudage wageze muri Afurika y\'Iburasirazuba mu 1897 ashaka isoko ya Nili. Yavumbuye uruzi Rukarara mu majyepfo y\'uburengerazuba bw\'u Rwanda nk\'isoko ya kure cyane ya Nili. Mu 1907, yashyizweho nk\'Umuturage wa mbere w\'Ubwami mu Rwanda kandi ahitamo Kigali nk\'ikigo cye cy\'ubuyobozi.',
      },
      image: imgKandtStatueFront,
      additionalImages: [imgKandtStatueRear].filter(Boolean),
      category: 'Monument',
      dateCreated: 'Early 2000s (commemorative)',
      originLocation: {
        en: 'Museum entrance grounds, Kigali, Rwanda',
        fr: 'Entrée du musée, Kigali, Rwanda',
        rw: 'Ku muryango w\'inzu ndangamurage, Kigali, u Rwanda',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const kandtPortrait = await Artifact.create({
      name: {
        en: 'Portrait of Richard Kandt (1897)',
        fr: 'Portrait de Richard Kandt (1897)',
        rw: 'Ifoto ya Richard Kandt (1897)',
      },
      description: {
        en: 'A rare historical black-and-white photograph of Dr. Richard Kandt taken in 1897, shortly before his first expedition into the heart of East Africa. The portrait shows the young German explorer in his colonial-era attire with a wide-brimmed hat.',
        fr: 'Une rare photographie historique en noir et blanc du Dr Richard Kandt prise en 1897, peu avant sa première expédition au cœur de l\'Afrique de l\'Est.',
        rw: 'Ifoto y\'amateka itabonetse kenshi y\'umweru n\'umukara ya Dr. Richard Kandt yafashwe mu 1897, mbere y\'urugendo rwe rwa mbere mu mutima wa Afurika y\'Iburasirazuba.',
      },
      historicalStory: {
        en: 'This photograph captures Richard Kandt at the age of 30, around the time he was preparing for his life-changing journey to find the source of the Nile. Born as Richard Kantorowicz in Posen (now Poznan, Poland) to a wealthy Jewish family, he changed his name to Kandt in 1893 and converted to Christianity. After studying medicine, he developed a deep fascination with African geography and exploration. This portrait is one of the few surviving photographs from before his African expeditions, making it an invaluable historical document.',
        fr: 'Cette photographie capture Richard Kandt à l\'âge de 30 ans, au moment où il se préparait pour son voyage transformateur à la recherche de la source du Nil.',
        rw: 'Iyi foto igaragaza Richard Kandt afite imyaka 30, mu gihe yiteguraga urugendo rwe rwo gushaka isoko ya Nili.',
      },
      image: imgKandtPortrait,
      category: 'Historical Photograph',
      dateCreated: '1897',
      originLocation: {
        en: 'Germany (pre-expedition portrait)',
        fr: 'Allemagne (portrait avant expédition)',
        rw: 'Ubudage (ifoto mbere y\'urugendo)',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const kandtDesk = await Artifact.create({
      name: {
        en: 'Kandt\'s Writing Desk & Fireplace',
        fr: 'Bureau d\'Écriture et Cheminée de Kandt',
        rw: 'Ameza y\'Ikandiko na Ziko bya Kandt',
      },
      description: {
        en: 'The original wooden writing desk and chair used by Richard Kandt in his colonial residence, positioned beside the stone fireplace where he spent many evenings drafting reports and correspondence.',
        fr: 'Le bureau d\'écriture en bois et la chaise originaux utilisés par Richard Kandt dans sa résidence coloniale, placés à côté de la cheminée en pierre.',
        rw: 'Ameza y\'igiti y\'ikandiko n\'intebe yakoreshejwe na Richard Kandt mu nzu ye y\'abakoloni, bishyizwe iruhande rw\'iziko ry\'amabuye.',
      },
      historicalStory: {
        en: 'From this modest desk beside the fireplace, Richard Kandt administered the colonial station of Kigali from 1907 until 1913. Here he wrote administrative reports to Berlin, composed his acclaimed book "Caput Nili" documenting his quest for the Nile\'s source, and penned letters describing the landscapes, peoples, and wildlife of Rwanda. The fireplace beside the desk provided warmth during Kigali\'s cool highland evenings at over 1,500 meters elevation. The desk and fireplace remain preserved in their original location within the museum, offering visitors an intimate glimpse into the daily life of Kigali\'s colonial founder.',
        fr: 'Depuis ce modeste bureau à côté de la cheminée, Kandt administrait la station coloniale de Kigali de 1907 à 1913. Il y écrivait des rapports à Berlin et composait son livre "Caput Nili".',
        rw: 'Kuri aya mesa afatanye na ziko, Kandt yayoboraga ikigo cy\'abakoloni cya Kigali kuva 1907 kugeza 1913. Yandikaga raporo za Berlin kandi yandika igitabo cye "Caput Nili".',
      },
      image: imgKandtDesk,
      category: 'Furniture',
      dateCreated: 'c. 1907',
      originLocation: {
        en: 'Kandt\'s colonial residence (now museum interior), Kigali',
        fr: 'Résidence coloniale de Kandt (intérieur du musée actuel), Kigali',
        rw: 'Inzu y\'abakoloni ya Kandt (imbere mu nzu ndangamurage), Kigali',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const crocodileSpecimen = await Artifact.create({
      name: {
        en: 'Nile Crocodile',
        fr: 'Crocodile du Nil',
        rw: 'Ingona ya Nili',
      },
      description: {
        en: 'A live Nile crocodile (Crocodylus niloticus) kept in the museum\'s outdoor enclosure — one of the museum\'s most impressive living exhibits. This powerful reptile can be seen basking on the grass near the museum building walls.',
        fr: 'Un crocodile du Nil vivant (Crocodylus niloticus) gardé dans l\'enclos extérieur du musée — l\'un des exhibits vivants les plus impressionnants.',
        rw: 'Ingona ya Nili (Crocodylus niloticus) ibitswe mu kibanza cy\'inyuma y\'inzu ndangamurage — kimwe mu bintu bihebuje cyane bigaragazwa.',
      },
      historicalStory: {
        en: 'The Nile crocodile has inhabited Rwanda\'s waterways — including Lakes Kivu, Muhazi, and Ihema — for millions of years. These apex predators can grow up to 6 meters long and live for over 70 years. They play a crucial ecological role in maintaining the health of freshwater ecosystems. The museum\'s crocodile enclosure allows visitors to observe these magnificent creatures up close and learn about Rwanda\'s aquatic biodiversity. Nile crocodiles were historically revered and feared in Rwandan culture, and their presence at the museum connects visitors to the country\'s rich natural heritage.',
        fr: 'Le crocodile du Nil habite les voies navigables du Rwanda depuis des millions d\'années. Ces prédateurs suprêmes jouent un rôle écologique crucial.',
        rw: 'Ingona ya Nili yabaye mu mazi y\'u Rwanda kuva kera cyane. Izi nyamaswa zikomeye zifite uruhare runini mu kubungabunga ibidukikije.',
      },
      image: imgCrocodile1,
      additionalImages: [imgCrocodile2].filter(Boolean),
      category: 'Living Specimen',
      originLocation: {
        en: 'Rwanda\'s lakes and river systems',
        fr: 'Lacs et systèmes fluviaux du Rwanda',
        rw: 'Ibiyaga n\'imigezi yo mu Rwanda',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const blackMamba = await Artifact.create({
      name: {
        en: 'Black Mamba Specimen',
        fr: 'Spécimen de Mamba Noir',
        rw: 'Urugero rwa Black Mamba',
      },
      description: {
        en: 'A preserved Black Mamba (Dendroaspis polylepis) displayed in a glass case with a naturalistic branch setting — Africa\'s longest venomous snake and one of the fastest snakes in the world, capable of speeds up to 20 km/h.',
        fr: 'Un Mamba noir (Dendroaspis polylepis) conservé dans une vitrine avec un décor naturel — le plus long serpent venimeux d\'Afrique.',
        rw: 'Black Mamba (Dendroaspis polylepis) yabitswe mu gitabo cy\'ikirahure hamwe n\'amashami — inzoka y\'ubumara ndende cyane muri Afurika.',
      },
      historicalStory: {
        en: 'Despite its name, the Black Mamba is not actually black — its body is olive to grey. The name comes from the inky-black interior of its mouth, which it displays when threatened. Growing up to 4.5 meters, it is the longest venomous snake in Africa. Its venom is extremely potent, containing both neurotoxins and cardiotoxins. Before the development of antivenom, a bite from a Black Mamba was almost always fatal. In Rwandan folklore, the mamba is both feared and respected as one of nature\'s most powerful creatures. This museum specimen allows visitors to study the snake\'s anatomy safely.',
        fr: 'Malgré son nom, le Mamba noir n\'est pas noir — son corps est olive à gris. Le nom vient de l\'intérieur noir de sa bouche.',
        rw: 'Nubwo yitwa Black Mamba, ntabwo ari umukara — umubiri wayo ni icyatsi kibisi kugeza ku kivu. Izina rivuye mu kanwa kayo k\'umukara.',
      },
      image: imgBlackMamba,
      category: 'Preserved Specimen',
      originLocation: {
        en: 'Sub-Saharan Africa',
        fr: 'Afrique subsaharienne',
        rw: 'Afurika yo munsi ya Sahara',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const gaboonViper = await Artifact.create({
      name: {
        en: 'Gaboon Viper Specimen',
        fr: 'Spécimen de Vipère du Gabon',
        rw: 'Urugero rwa Gaboon Viper',
      },
      description: {
        en: 'A preserved Gaboon Viper (Bitis gabonica) showing its spectacular geometric camouflage pattern of browns, tans, and purples. This species has the longest fangs of any venomous snake — up to 5 cm.',
        fr: 'Une Vipère du Gabon (Bitis gabonica) conservée montrant son spectaculaire motif de camouflage géométrique.',
        rw: 'Gaboon Viper (Bitis gabonica) yabitswe igaragaza imiterere yayo y\'amabara atangaje.',
      },
      historicalStory: {
        en: 'The Gaboon Viper is the heaviest venomous snake in Africa, weighing up to 20 kg. Its geometric pattern of overlapping diamonds and triangles in earth tones provides perfect camouflage on the forest floor, making it nearly invisible among fallen leaves. It delivers the highest venom yield of any snake — up to 600 mg in a single bite. Despite this, it is a docile ambush predator that rarely bites humans unless stepped on. Found in Rwanda\'s remaining montane and lowland forests, the Gaboon Viper is an indicator species for healthy forest ecosystems.',
        fr: 'La Vipère du Gabon est le serpent venimeux le plus lourd d\'Afrique. Son motif géométrique offre un camouflage parfait.',
        rw: 'Gaboon Viper ni inzoka y\'ubumara iremereye cyane muri Afurika. Imiterere yayo itanga ubwihisho bwiza cyane.',
      },
      image: imgGaboonViper,
      category: 'Preserved Specimen',
      originLocation: {
        en: 'Central and West African forests',
        fr: 'Forêts d\'Afrique centrale et occidentale',
        rw: 'Amashyamba yo muri Afurika yo hagati n\'iburengerazuba',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const craftsDisplay = await Artifact.create({
      name: {
        en: 'Rwandan Crafts Collection',
        fr: 'Collection d\'Artisanat Rwandais',
        rw: 'Ikusanyirizo ry\'Ubuhanzi bw\'u Rwanda',
      },
      description: {
        en: 'A curated display of traditional Rwandan crafts on wooden shelves, featuring Agaseke peace baskets with their distinctive woven lids, Imigongo cow-dung geometric art panels, colorful beaded accessories, and handmade pottery.',
        fr: 'Un ensemble organisé d\'artisanat traditionnel rwandais sur des étagères en bois, comprenant les paniers Agaseke, les panneaux d\'art Imigongo, et des accessoires perlés.',
        rw: 'Igaragazwa ry\'ubuhanzi gakondo bw\'u Rwanda ku mashami y\'igiti, birimo uduseke Agaseke, ubuhanzi bw\'Imigongo, udushya tw\'amasaro, n\'ibumba.',
      },
      historicalStory: {
        en: 'This collection represents centuries of Rwandan artistic tradition. The Agaseke basket, woven from sisal and sweet grass, has been a Rwandan cultural symbol for generations. In 2004 it was adopted as a national symbol of unity and peace, used prominently in the annual Umushyikirano national dialogue. Imigongo art originated in the ancient Gisaka Kingdom of eastern Rwanda — women artists mix cow dung with natural earth pigments to create stunning black, white, and red geometric patterns. The technique was nearly lost during the 20th century but has been revived and is now recognized as one of Rwanda\'s most distinctive art forms.',
        fr: 'Cette collection représente des siècles de tradition artistique rwandaise. Le panier Agaseke est un symbole culturel depuis des générations.',
        rw: 'Iki gisanyirizo kigaragaza imyaka myinshi y\'umuco w\'ubuhanzi bw\'u Rwanda. Agaseke ni ikimenyetso cy\'umuco kuva kera.',
      },
      image: imgCrafts,
      category: 'Cultural Art',
      originLocation: {
        en: 'Various regions of Rwanda',
        fr: 'Différentes régions du Rwanda',
        rw: 'Uturere dutandukanye tw\'u Rwanda',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const colonialWheel = await Artifact.create({
      name: {
        en: 'Colonial-Era Industrial Wheel',
        fr: 'Roue Industrielle de l\'Ère Coloniale',
        rw: 'Uruziga rw\'Inganda rw\'Igihe cy\'Abakoloni',
      },
      description: {
        en: 'An original heavy iron industrial wheel from the German colonial period, displayed by a turquoise-framed window inside the museum. This piece of European machinery was imported to Rwanda in the early 1900s.',
        fr: 'Une roue industrielle en fer lourde de la période coloniale allemande, exposée près d\'une fenêtre à cadre turquoise à l\'intérieur du musée.',
        rw: 'Uruziga rw\'ibyuma biremereye rw\'inganda rw\'igihe cy\'abakoloni b\'Abadage, rugaragazwa iruhande rw\'idirishya ry\'icyatsi kibisi mu nzu ndangamurage.',
      },
      historicalStory: {
        en: 'During the German colonial period (1897–1916), European administrators imported industrial machinery to support infrastructure development in Rwanda. This wheel was part of equipment used for early construction and transportation projects in the Kigali area. It represents the technological encounter between industrial Europe and pre-industrial Rwanda. When Belgium took over administration after World War I (1916–1962), more machinery followed. Today, this wheel stands as a tangible reminder of how colonialism reshaped Rwanda\'s physical landscape and economy.',
        fr: 'Pendant la période coloniale allemande (1897–1916), les administrateurs européens ont importé des machines industrielles pour le développement des infrastructures.',
        rw: 'Mu gihe cy\'ubukoloni bw\'Abadage (1897–1916), abayobozi b\'Abanyaburayi bazanye imashini z\'inganda mu Rwanda.',
      },
      image: imgColonialWheel,
      category: 'Industrial Artifact',
      dateCreated: 'c. 1910',
      originLocation: {
        en: 'Imported from Germany to Kigali',
        fr: 'Importée d\'Allemagne à Kigali',
        rw: 'Yaturutse mu Budage igezwa i Kigali',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const historicalPhotos = await Artifact.create({
      name: {
        en: 'Gusimbuka Urukiramende — Traditional High-Jump Photographs',
        fr: 'Gusimbuka Urukiramende — Photos de Saut en Hauteur Traditionnel',
        rw: 'Amafoto ya Gusimbuka Urukiramende',
      },
      description: {
        en: 'Large-format historical photographs displayed on the museum walls showing the traditional Rwandan high-jump competition known as Gusimbuka Urukiramende. The central image captures a young Rwandan man clearing an extraordinary height while colonial-era European officials watch.',
        fr: 'Photographies historiques grand format exposées sur les murs du musée montrant la compétition traditionnelle rwandaise de saut en hauteur — Gusimbuka Urukiramende.',
        rw: 'Amafoto y\'amateka manini agaragazwa ku mpande z\'inzu ndangamurage agaragaza umukino gakondo wo Gusimbuka Urukiramende.',
      },
      historicalStory: {
        en: 'Gusimbuka Urukiramende (literally "to jump over a stick") was a traditional Rwandan athletic competition practiced for centuries. Young Tutsi men would leap over a bar set at remarkable heights — some historical accounts describe jumps exceeding 2.5 meters using a run-up technique. This was one of several traditional sports practiced in the royal court. The photographs in the museum date from the colonial period (early 1900s) and show European colonial officials observing the competition. These images are among the earliest photographic records of Rwandan traditional culture and provide invaluable evidence of pre-colonial athletic traditions that predate modern Olympic high-jump techniques.',
        fr: 'Gusimbuka Urukiramende était une compétition athlétique traditionnelle rwandaise pratiquée pendant des siècles.',
        rw: 'Gusimbuka Urukiramende ni umukino gakondo w\'u Rwanda wakorwaga kuva kera. Abagabo b\'abatutsi basimburaga urukiramende ku buhagarike butangaje.',
      },
      image: imgHistoricalPhotos,
      category: 'Historical Photograph',
      dateCreated: 'c. 1907–1916',
      originLocation: {
        en: 'Colonial-era Rwanda',
        fr: 'Rwanda de l\'ère coloniale',
        rw: 'U Rwanda rw\'igihe cy\'abakoloni',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const museumBuilding = await Artifact.create({
      name: {
        en: 'The Kandt House Museum Building',
        fr: 'Le Bâtiment du Musée Maison Kandt',
        rw: 'Inyubako y\'Inzu Ndangamurage ya Kandt',
      },
      description: {
        en: 'The museum building itself — a distinctive pink colonial residence with turquoise-painted window frames and doors, terracotta roof tiles, and a raised entrance with stone steps. Built on a hilltop overlooking the Nyabugogo valley in Kigali.',
        fr: 'Le bâtiment du musée — une résidence coloniale rose distinctive avec des cadres de fenêtres et de portes peints en turquoise, des tuiles en terre cuite.',
        rw: 'Inyubako y\'inzu ndangamurage — inzu y\'abakoloni y\'ibara ry\'umutuku ifite amadirishya n\'inzugi z\'icyatsi kibisi, ibikoresho by\'ibumba.',
      },
      historicalStory: {
        en: 'This building was constructed in the early 1900s as the personal residence of Dr. Richard Kandt, the first German Imperial Resident of Rwanda. Located on KN 82 Street in Kigali, the house sits on one of the city\'s many hills, offering commanding views of the surrounding valleys. After Rwanda gained independence in 1962, the building was transformed from a symbol of colonial authority into a national institution dedicated to preserving Rwanda\'s natural history and cultural heritage. The distinctive pink-and-turquoise color scheme, colonial-era brick and stonework, and the terracotta tile roof have been carefully maintained. Today it is officially known as the Kandt House Museum of Natural History and serves as one of Kigali\'s most important cultural landmarks.',
        fr: 'Ce bâtiment a été construit au début des années 1900 comme résidence personnelle du Dr Richard Kandt. Après l\'indépendance du Rwanda en 1962, il a été transformé en musée national.',
        rw: 'Iyi nyubako yubatswe mu ntangiriro z\'imyaka ya 1900 nk\'inzu y\'umwuga ya Dr. Richard Kandt. Nyuma y\'ubwigenge bw\'u Rwanda mu 1962, yahinduwe ikaba inzu ndangamurage y\'igihugu.',
      },
      image: imgMuseumFront,
      additionalImages: [imgMuseumSide].filter(Boolean),
      category: 'Historic Building',
      dateCreated: 'c. 1907',
      originLocation: {
        en: 'KN 82 Street, Kigali, Rwanda',
        fr: 'Rue KN 82, Kigali, Rwanda',
        rw: 'Umuhanda wa KN 82, Kigali, u Rwanda',
      },
      status: 'published', createdBy: adminUser._id,
    });

    const arScanning = await Artifact.create({
      name: {
        en: 'AR Smart Tourism Experience',
        fr: 'Expérience de Tourisme Intelligent AR',
        rw: 'Uburambe bwa AR bwo Gusura',
      },
      description: {
        en: 'The museum\'s QR-enabled augmented reality smart tourism system. Visitors use their smartphones to scan QR codes placed throughout the museum to access immersive digital content, including 3D historical reconstructions and interactive stories.',
        fr: 'Le système de tourisme intelligent en réalité augmentée du musée activé par QR. Les visiteurs utilisent leurs smartphones pour scanner les codes QR.',
        rw: 'Sisitemu ya tekinoloji y\'inzu ndangamurage ikoresha QR. Abashyitsi bakoresha telefone zabo gusikana kode za QR kugira ngo babone ibintu bishimishije.',
      },
      historicalStory: {
        en: 'In 2025, the Kandt House Museum embraced cutting-edge technology by launching its AR Smart Tourism system. By scanning QR codes placed next to exhibits, visitors can see historical photographs come to life, view 3D reconstructions of colonial-era Kigali, listen to audio narrations in multiple languages (English, French, and Kinyarwanda), and interact with digital stories about each artifact. This technology bridges the gap between the museum\'s physical collection and the rich historical context behind each piece, making the museum experience more immersive and accessible to visitors from around the world.',
        fr: 'En 2025, le Musée Maison Kandt a lancé son système de tourisme intelligent AR, permettant aux visiteurs de découvrir des contenus numériques immersifs.',
        rw: 'Mu 2025, Inzu Ndangamurage ya Kandt yashyizeho sisitemu ya AR, ituma abashyitsi basura ibintu bishya by\'ikoranabuhanga.',
      },
      image: imgARScanner,
      category: 'Technology',
      dateCreated: '2025',
      originLocation: {
        en: 'Kandt House Museum, Kigali',
        fr: 'Musée Maison Kandt, Kigali',
        rw: 'Inzu Ndangamurage ya Kandt, Kigali',
      },
      status: 'published', createdBy: adminUser._id,
    });

    // ═══════════════════════════════════════════════════════════════
    // ── 3. Create Exhibitions (linked to correct artifacts) ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏛  Creating exhibitions...');

    const kandtExhibition = await Exhibition.create({
      title: {
        en: 'Richard Kandt: Explorer & Founder of Kigali',
        fr: 'Richard Kandt : Explorateur & Fondateur de Kigali',
        rw: 'Richard Kandt: Umushakashatsi & Umushinze wa Kigali',
      },
      shortDescription: {
        en: 'Discover the remarkable journey of Dr. Richard Kandt — the German explorer who traced the source of the Nile and established the colonial station that became Rwanda\'s capital city.',
        fr: 'Découvrez le parcours remarquable du Dr Richard Kandt — l\'explorateur allemand qui a retracé la source du Nil et fondé Kigali.',
        rw: 'Menya urugendo rutangaje rwa Dr. Richard Kandt — umushakashatsi w\'Ubudage washakishije isoko ya Nili kandi ashinga Kigali.',
      },
      fullDescription: {
        en: 'This exhibition tells the story of Richard Kandt through the artifacts he left behind — his statue at the museum entrance, his rare 1897 portrait photograph, and the writing desk where he administered Kigali. Kandt arrived in East Africa in 1897 on a quest to find the true source of the Nile. His expeditions took him through uncharted territories of modern-day Rwanda, where he identified the Rukarara River as the most distant headwater. In 1907, he was appointed the first Imperial Resident and chose Kigali as his base — founding the city.',
        fr: 'Cette exposition raconte l\'histoire de Richard Kandt à travers les artefacts qu\'il a laissés derrière lui.',
        rw: 'Iki murikagurisha kiganira inkuru ya Richard Kandt binyuze mu bikoresho yasize inyuma.',
      },
      historicalSignificance: {
        en: 'The Kandt House is one of the oldest colonial-era structures in Kigali and represents a pivotal chapter in Rwanda\'s history — the founding of its capital city.',
        fr: 'La Maison Kandt est l\'une des plus anciennes structures coloniales à Kigali.',
        rw: 'Inzu ya Kandt ni imwe mu nyubako za kera cyane z\'igihe cy\'abakoloni i Kigali.',
      },
      timeline: [
        { year: 1867, event: { en: 'Richard Kantorowicz born in Posen, Prussia', fr: 'Naissance à Posen', rw: 'Avukira i Posen' } },
        { year: 1897, event: { en: 'Arrives in East Africa to find the source of the Nile', fr: 'Arrive en Afrique de l\'Est', rw: 'Agera muri Afurika y\'Iburasirazuba' } },
        { year: 1898, event: { en: 'Identifies the Rukarara River as the Nile\'s most distant source', fr: 'Identifie la Rukarara comme source', rw: 'Avumbura Rukarara nk\'isoko ya Nili' } },
        { year: 1907, event: { en: 'Appointed first Imperial Resident; establishes Kigali', fr: 'Nommé premier Résident; fonde Kigali', rw: 'Ashyirwaho nk\'Umuturage wa mbere; ashinga Kigali' } },
        { year: 1913, event: { en: 'Leaves Rwanda due to illness', fr: 'Quitte le Rwanda', rw: 'Ava mu Rwanda' } },
        { year: 1918, event: { en: 'Dies in Nuremberg, Germany', fr: 'Décède à Nuremberg', rw: 'Apfa i Nuremberg' } },
      ],
      artifacts: [kandtStatue._id, kandtPortrait._id, kandtDesk._id],
      accessLevel: 'public_preview', status: 'published', order: 1,
      tags: ['history', 'colonial', 'kandt', 'kigali', 'exploration', 'nile'],
      createdBy: adminUser._id,
    });

    const wildlifeExhibition = await Exhibition.create({
      title: {
        en: 'Wildlife of Rwanda: Reptiles & Biodiversity',
        fr: 'Faune du Rwanda : Reptiles & Biodiversité',
        rw: 'Inyamaswa zo mu Rwanda: Ibikururuka & Ubudasa bw\'ibinyabuzima',
      },
      shortDescription: {
        en: 'Come face-to-face with Rwanda\'s remarkable reptilian diversity — from the powerful Nile crocodile to the deadly Black Mamba and the masterfully camouflaged Gaboon Viper.',
        fr: 'Rencontrez la diversité reptilienne du Rwanda — du puissant crocodile du Nil au mortel Mamba noir.',
        rw: 'Huza imboni n\'ubudasa bw\'ibikururuka bwo mu Rwanda — kuva ku ngona ya Nili kugeza kuri Black Mamba.',
      },
      fullDescription: {
        en: 'The Kandt House Museum houses an impressive collection of Rwanda\'s reptilian wildlife. The outdoor crocodile enclosure lets visitors observe a live Nile crocodile — one of Africa\'s most powerful predators. Inside, preserved specimens of the Black Mamba and Gaboon Viper showcase the remarkable diversity of African snakes, from the fastest (Black Mamba) to the heaviest (Gaboon Viper) venomous species.',
        fr: 'Le Musée Maison Kandt abrite une collection impressionnante de reptiles du Rwanda.',
        rw: 'Inzu Ndangamurage ya Kandt ibamo ikusanyirizo ritangaje ry\'ibikururuka byo mu Rwanda.',
      },
      historicalSignificance: {
        en: 'Rwanda\'s natural history collections were first documented during the colonial period and continue to educate visitors about the country\'s extraordinary biodiversity.',
        fr: 'Les collections d\'histoire naturelle du Rwanda ont été documentées pendant la période coloniale.',
        rw: 'Ikusanyirizo ry\'ibidukikije byo mu Rwanda ryanditswe mu gihe cy\'abakoloni.',
      },
      timeline: [
        { year: 1925, event: { en: 'Albert National Park established — first in Africa', fr: 'Parc National Albert créé', rw: 'Parike ya Albert yashinzwe' } },
        { year: 1934, event: { en: 'Volcanoes National Park created to protect mountain gorillas', fr: 'Parc des Volcans créé', rw: 'Parike y\'Ibirunga yashinzwe' } },
        { year: 2005, event: { en: 'Akagera National Park expanded for wildlife conservation', fr: 'Parc d\'Akagera élargi', rw: 'Parike ya Akagera yagutse' } },
      ],
      artifacts: [crocodileSpecimen._id, blackMamba._id, gaboonViper._id],
      accessLevel: 'public_preview', status: 'published', order: 2,
      tags: ['wildlife', 'reptiles', 'biodiversity', 'conservation'],
      createdBy: adminUser._id,
    });

    const cultureExhibition = await Exhibition.create({
      title: {
        en: 'Rwandan Arts, Crafts & Cultural Heritage',
        fr: 'Arts, Artisanat & Patrimoine Culturel Rwandais',
        rw: 'Ubuhanzi, Ubucuruzi & Umuco Gakondo w\'u Rwanda',
      },
      shortDescription: {
        en: 'Discover the rich artistic traditions of Rwanda — from the iconic Agaseke peace baskets to the distinctive Imigongo cow-dung geometric art.',
        fr: 'Découvrez les riches traditions artistiques du Rwanda.',
        rw: 'Menya umuco w\'ubuhanzi w\'u Rwanda — kuva ku gaseke kugeza ku migongo.',
      },
      fullDescription: {
        en: 'This exhibition showcases the artistic genius of the Rwandan people through a curated collection of traditional crafts. Visitors can admire Agaseke baskets, Imigongo panels, pottery, and beadwork alongside colonial-era photographs that document how these traditions were practiced historically.',
        fr: 'Cette exposition met en valeur le génie artistique du peuple rwandais à travers une collection organisée d\'artisanat traditionnel.',
        rw: 'Iki murikagurisha kigaragaza ubuhanga bw\'ubuhanzi bw\'Abanyarwanda binyuze mu gisanyirizo cy\'ubuhanzi gakondo.',
      },
      timeline: [
        { year: 1800, event: { en: 'Imigongo art flourishes in the Gisaka Kingdom', fr: 'L\'art Imigongo prospère dans le Royaume de Gisaka', rw: 'Ubuhanzi bw\'Imigongo butera imbere mu Bwami bwa Gisaka' } },
        { year: 2004, event: { en: 'Agaseke basket adopted as symbol of national unity', fr: 'Agaseke adopté comme symbole national', rw: 'Agaseke yemewe nk\'ikimenyetso cy\'ubumwe' } },
      ],
      artifacts: [craftsDisplay._id, historicalPhotos._id],
      accessLevel: 'public_preview', status: 'published', order: 3,
      tags: ['culture', 'tradition', 'art', 'heritage', 'imigongo', 'agaseke'],
      createdBy: adminUser._id,
    });

    const colonialExhibition = await Exhibition.create({
      title: {
        en: 'Colonial Life in Rwanda: Artifacts & Photographs',
        fr: 'La Vie Coloniale au Rwanda : Artefacts & Photographies',
        rw: 'Ubuzima bw\'Abakoloni mu Rwanda: Ibikoresho & Amafoto',
      },
      shortDescription: {
        en: 'Step back in time through original colonial-era furniture, industrial machinery, and rare historical photographs documenting Rwanda under European rule.',
        fr: 'Remontez dans le temps à travers des meubles, machines et photographies de l\'ère coloniale.',
        rw: 'Subira mu mateka binyuze mu bikoresho, imashini n\'amafoto by\'igihe cy\'abakoloni.',
      },
      fullDescription: {
        en: 'This exhibition preserves tangible evidence of the colonial period in Rwanda, spanning German East Africa (1897–1916) and the Belgian mandate (1916–1962). From Kandt\'s writing desk to imported industrial machinery, and from rare photographs of traditional high-jump competitions to the portrait of Kandt himself, these artifacts tell the complex story of Rwanda\'s encounter with European colonialism.',
        fr: 'Cette exposition conserve des preuves tangibles de la période coloniale au Rwanda.',
        rw: 'Iki murikagurisha kibika ibimenyetso bigaragara by\'igihe cy\'abakoloni mu Rwanda.',
      },
      timeline: [
        { year: 1897, event: { en: 'German colonial presence established in Rwanda', fr: 'Présence coloniale allemande établie', rw: 'Ubukoloni bw\'Abadage bushingwa' } },
        { year: 1916, event: { en: 'Belgian forces occupy Rwanda during WWI', fr: 'Les forces belges occupent le Rwanda', rw: 'Ingabo z\'Ababirigi zigarurira u Rwanda' } },
        { year: 1962, event: { en: 'Rwanda gains independence', fr: 'Le Rwanda obtient son indépendance', rw: 'U Rwanda rubona ubwigenge' } },
      ],
      artifacts: [kandtDesk._id, colonialWheel._id, historicalPhotos._id, kandtPortrait._id],
      accessLevel: 'public_preview', status: 'published', order: 4,
      tags: ['colonial', 'history', 'photographs', 'artifacts'],
      createdBy: adminUser._id,
    });

    const museumExhibition = await Exhibition.create({
      title: {
        en: 'The Kandt House Museum: Then & Now',
        fr: 'Le Musée Maison Kandt : Hier & Aujourd\'hui',
        rw: 'Inzu Ndangamurage ya Kandt: Icyo Gihe & Ubu',
      },
      shortDescription: {
        en: 'From a colonial governor\'s residence to Rwanda\'s premier natural history museum — explore the transformation of this historic building and its embrace of modern technology.',
        fr: 'D\'une résidence de gouverneur colonial au premier musée d\'histoire naturelle du Rwanda.',
        rw: 'Kuva mu nzu y\'umuyobozi w\'abakoloni kugeza ku nzu ndangamurage nziza cyane mu Rwanda.',
      },
      fullDescription: {
        en: 'The Kandt House Museum tells the story of its own remarkable transformation. Built as Richard Kandt\'s personal residence in 1907, this pink-walled colonial building with its distinctive turquoise accents has been reborn as Rwanda\'s leading natural history museum. Today it combines historical preservation with cutting-edge AR smart tourism technology, allowing visitors to experience the past through digital reconstructions while standing in the very rooms where colonial history was made.',
        fr: 'Le Musée Maison Kandt raconte l\'histoire de sa propre transformation remarquable.',
        rw: 'Inzu Ndangamurage ya Kandt iganira inkuru y\'ihinduka ryayo ritangaje.',
      },
      timeline: [
        { year: 1907, event: { en: 'Kandt builds his colonial residence in Kigali', fr: 'Kandt construit sa résidence', rw: 'Kandt yubaka inzu ye i Kigali' } },
        { year: 1962, event: { en: 'Building repurposed for heritage preservation after independence', fr: 'Bâtiment reconverti après l\'indépendance', rw: 'Inyubako ikoreshwa mu kubika umuco nyuma y\'ubwigenge' } },
        { year: 2025, event: { en: 'AR Smart Tourism System launched', fr: 'Système AR lancé', rw: 'Sisitemu ya AR yatangiye' } },
      ],
      artifacts: [museumBuilding._id, arScanning._id, kandtStatue._id],
      accessLevel: 'public_preview', status: 'published', order: 5,
      tags: ['museum', 'building', 'history', 'architecture', 'technology'],
      createdBy: adminUser._id,
    });

    // ═══════════════════════════════════════════════════════════════
    // ── 4. Create Stories (multiple per exhibition) ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📖 Creating stories...');

    await Story.insertMany([
      // ── Kandt Exhibition Stories ──
      {
        exhibitionId: kandtExhibition._id,
        title: { en: 'The Quest for the Source of the Nile', fr: 'La Quête de la Source du Nil', rw: 'Gushaka Isoko ya Nili' },
        content: {
          en: 'In 1897, a young German doctor named Richard Kandt left behind the comfort of European life and set out on one of the most ambitious geographical expeditions of his era — to find the true source of the River Nile, one of the great unsolved mysteries of 19th-century exploration.\n\nHis journey took him through mountains, dense forests, and uncharted valleys in the heart of East Africa. In 1898, deep in the highlands of southwestern Rwanda, he identified the Rukarara River — a small, clear stream flowing through lush green hills — as the most distant headwater of the Nile. He documented his findings in his celebrated book "Caput Nili" (Head of the Nile).\n\nThis discovery would later be confirmed by modern geographers and remains one of the defining achievements of late 19th-century African exploration.',
          fr: 'En 1897, un jeune médecin allemand nommé Richard Kandt a quitté le confort de la vie européenne pour entreprendre l\'une des expéditions géographiques les plus ambitieuses de son époque.',
          rw: 'Mu 1897, umuganga w\'Umunyaburayi witwa Richard Kandt yasivye mu buzima bwiza bw\'Uburayi kugira ngo atangire kimwe mu ngendo z\'ubushakashatsi zikomeye cyane z\'icyo gihe.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: kandtExhibition._id,
        title: { en: 'How Kigali Was Founded', fr: 'Comment Kigali a Été Fondé', rw: 'Uko Kigali Yashinzwe' },
        content: {
          en: 'In 1907, the German colonial government appointed Richard Kandt as the first Imperial Resident (Kaiserlicher Resident) of Rwanda. He was tasked with establishing an administrative center for the colony.\n\nKandt chose a hilltop settlement called Kigali — a strategic location with commanding views of the surrounding valleys and access to water sources. At the time, Kigali was little more than a small village. Kandt built his residence here (the very building that is now this museum) and established the colonial administrative station.\n\nFrom his modest desk beside the fireplace, Kandt governed the territory, wrote reports to Berlin, and laid the administrative foundations for what would eventually grow into Rwanda\'s bustling capital city of over 1.7 million people.',
          fr: 'En 1907, le gouvernement colonial allemand a nommé Richard Kandt comme premier Résident impérial du Rwanda. Il choisit Kigali comme centre administratif.',
          rw: 'Mu 1907, guverinoma y\'abakoloni b\'Abadage yashyizeho Richard Kandt nk\'Umuturage wa mbere w\'Ubwami mu Rwanda. Yahisemo Kigali nk\'ikigo cy\'ubuyobozi.',
        },
        status: 'published', order: 2, createdBy: adminUser._id,
      },
      {
        exhibitionId: kandtExhibition._id,
        title: { en: 'Kandt\'s Legacy: From Colonial Past to National Heritage', fr: 'L\'Héritage de Kandt', rw: 'Umurage wa Kandt' },
        content: {
          en: 'Richard Kandt left Rwanda in 1913 due to declining health. He died in Nuremberg in 1918 during the final year of World War I, never returning to the land he had explored and administered.\n\nHis legacy in Rwanda is complex. While he represented colonial power, his documentation of Rwandan geography, culture, and natural history preserved invaluable knowledge. His residence became a national museum dedicated to Rwanda\'s own heritage — transforming a symbol of colonial control into a center for cultural pride and education.\n\nToday, the golden statue at the museum entrance commemorates not just the man, but the founding moment of a capital city that has become a symbol of Africa\'s renaissance.',
          fr: 'Kandt a quitté le Rwanda en 1913 pour raisons de santé. Il est mort à Nuremberg en 1918. Son héritage au Rwanda est complexe.',
          rw: 'Kandt yasize u Rwanda mu 1913 kubera uburwayi. Yapfiriye i Nuremberg mu 1918. Umurage we mu Rwanda urakomeye.',
        },
        status: 'published', order: 3, createdBy: adminUser._id,
      },

      // ── Wildlife Exhibition Stories ──
      {
        exhibitionId: wildlifeExhibition._id,
        title: { en: 'Guardians of the Water: Rwanda\'s Nile Crocodiles', fr: 'Gardiens de l\'Eau : Les Crocodiles du Nil', rw: 'Abarinzi b\'Amazi: Ingona za Nili' },
        content: {
          en: 'The Nile crocodile has inhabited Rwanda\'s waterways — from the shores of Lake Kivu to the winding rivers of Akagera — for millions of years. These powerful apex predators can grow up to 6 meters long and live for over 70 years.\n\nThe museum\'s outdoor crocodile enclosure gives visitors a rare chance to observe this magnificent creature up close. Watch how it basks motionless in the sun, jaws agape in a natural cooling behavior, or lurks silently along the wall of its enclosure — a reminder that these ancient reptiles have survived virtually unchanged since the age of dinosaurs.\n\nIn Rwandan culture, the crocodile commands both fear and respect as a guardian spirit of the waterways.',
          fr: 'Le crocodile du Nil habite les voies navigables du Rwanda depuis des millions d\'années.',
          rw: 'Ingona ya Nili yabaye mu mazi y\'u Rwanda kuva kera cyane.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: wildlifeExhibition._id,
        title: { en: 'The Deadly Duo: Black Mamba & Gaboon Viper', fr: 'Le Duo Mortel : Mamba Noir & Vipère du Gabon', rw: 'Inzoka Ebyiri Zitera Ubwoba' },
        content: {
          en: 'Africa is home to some of the world\'s most remarkable snakes, and two of its most formidable species are preserved here at the museum.\n\nThe Black Mamba — Africa\'s longest venomous snake at up to 4.5 meters — is also the fastest, capable of bursts of 20 km/h. Despite its name, the snake is actually olive to grey; "black" refers to the ink-colored interior of its mouth, displayed as a warning when threatened.\n\nIn stark contrast, the Gaboon Viper is a master of patience and camouflage. The heaviest venomous snake in Africa (up to 20 kg), it lies motionless on the forest floor, its geometric brown-and-tan pattern making it virtually invisible among fallen leaves. When it strikes, its 5 cm fangs — the longest of any snake — deliver more venom than any other species.\n\nTogether, they represent the extraordinary evolutionary diversity of African serpents.',
          fr: 'L\'Afrique abrite certains des serpents les plus remarquables du monde.',
          rw: 'Afurika ni ahantu h\'inzoka zitangaje cyane ku isi.',
        },
        status: 'published', order: 2, createdBy: adminUser._id,
      },

      // ── Culture Exhibition Stories ──
      {
        exhibitionId: cultureExhibition._id,
        title: { en: 'Imigongo: Masterpieces from Cow Dung', fr: 'Imigongo : Chefs-d\'œuvre en Bouse de Vache', rw: 'Imigongo: Ubuhanzi Budasanzwe' },
        content: {
          en: 'In the ancient Gisaka Kingdom of eastern Rwanda, women artists discovered that cow dung — one of the most humble materials available — could be transformed into stunning works of geometric art.\n\nThe Imigongo technique involves mixing cow dung with natural earth pigments to create bold patterns of black, white, red, and grey arranged in repeating diamonds, spirals, and triangles. Each panel is unique, reflecting the individual artist\'s creativity within traditional motifs.\n\nThis art form was nearly lost during the upheavals of the 20th century. Thanks to the dedication of Rwandan women artists, Imigongo has been revived and is now recognized internationally as one of Africa\'s most distinctive artistic traditions. Today, Imigongo panels decorate homes, hotels, and government buildings across Rwanda.',
          fr: 'Dans l\'ancien Royaume de Gisaka, les femmes artistes ont découvert que la bouse de vache pouvait être transformée en art géométrique.',
          rw: 'Mu Bwami bwa Gisaka bwa kera, abagore b\'abahanzi bavumbuye ko amase y\'inka ashobora guhindurwa ubuhanzi.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: cultureExhibition._id,
        title: { en: 'The Agaseke: Rwanda\'s Basket of Peace', fr: 'L\'Agaseke : Le Panier de Paix du Rwanda', rw: 'Agaseke: Igiseke cy\'Amahoro' },
        content: {
          en: 'The Agaseke is a small, lidded basket woven from sisal and sweet grass — and it carries a meaning far greater than its modest size suggests.\n\nFor centuries, Rwandan women have woven these baskets as gifts symbolizing friendship, goodwill, and community. The intricate weaving patterns, passed from mother to daughter, represent patience, skill, and cultural continuity.\n\nIn 2004, the Agaseke was adopted as a national symbol of unity and reconciliation in post-genocide Rwanda. It is now used prominently in the annual Umushyikirano (National Dialogue) where citizens present their concerns to the President in a spirit of openness — symbolized by lifting the basket\'s lid. The Agaseke reminds Rwandans that even the most complex problems can be addressed through dialogue and mutual respect.',
          fr: 'L\'Agaseke est un petit panier à couvercle tressé en sisal — portant un sens bien plus grand que sa taille modeste.',
          rw: 'Agaseke ni akaseke gato gafite umupfundikizo — kandi gafite icyo gasobanura kiruta ubunini bwako.',
        },
        status: 'published', order: 2, createdBy: adminUser._id,
      },

      // ── Colonial Exhibition Stories ──
      {
        exhibitionId: colonialExhibition._id,
        title: { en: 'Through the Lens: Colonial-Era Rwanda', fr: 'À Travers l\'Objectif : Le Rwanda Colonial', rw: 'Binyuze mu Mafoto: U Rwanda rw\'Abakoloni' },
        content: {
          en: 'The museum houses remarkable large-format photographs from the colonial period that provide rare visual windows into early 20th-century Rwanda.\n\nThe most striking images capture the traditional Rwandan high-jump competition known as Gusimbuka Urukiramende — "to jump over a stick." Young men would leap extraordinary heights using a running approach, sometimes clearing bars set above 2.5 meters. European colonial officials documented these competitions with evident amazement.\n\nThese photographs serve a dual purpose: they record a uniquely Rwandan athletic tradition that predates modern Olympic techniques, while also documenting the colonial gaze — European men in formal dress watching African athletes, a visual metaphor for the power dynamics of the era.',
          fr: 'Le musée abrite des photographies remarquables grand format de la période coloniale.',
          rw: 'Inzu ndangamurage ibamo amafoto atangaje y\'igihe cy\'abakoloni.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: colonialExhibition._id,
        title: { en: 'Objects of Empire: What the Colonists Left Behind', fr: 'Objets d\'Empire : Ce Que les Colonisateurs Ont Laissé', rw: 'Ibintu by\'Ubukoloni: Ibyo Abakoloni Basize' },
        content: {
          en: 'Every object in this exhibition tells a story of cultural encounter. The heavy iron wheel — imported from Germany for construction projects — represents the introduction of industrial technology to a pre-industrial society. Kandt\'s writing desk speaks of administrative power: from this simple wooden table, one man governed an entire territory.\n\nThese objects are not merely historical curiosities. They are evidence of how colonialism physically reshaped Rwanda — importing European machinery, imposing European systems of governance, and documenting (and often misunderstanding) the rich culture they encountered. By examining these artifacts critically, visitors gain a nuanced understanding of this complex period.',
          fr: 'Chaque objet dans cette exposition raconte une histoire de rencontre culturelle.',
          rw: 'Buri kintu muri iki murikagurisha kiganira inkuru y\'amahuriro y\'imico.',
        },
        status: 'published', order: 2, createdBy: adminUser._id,
      },

      // ── Museum Exhibition Stories ──
      {
        exhibitionId: museumExhibition._id,
        title: { en: 'From Governor\'s House to People\'s Museum', fr: 'De la Maison du Gouverneur au Musée du Peuple', rw: 'Kuva mu Nzu y\'Umuyobozi Kugera ku Nzu Ndangamurage' },
        content: {
          en: 'When Richard Kandt built this pink-walled residence on a Kigali hilltop in 1907, it was a symbol of colonial authority — the seat of German imperial power in Rwanda.\n\nAfter independence in 1962, the building took on a new purpose: preserving and celebrating Rwanda\'s own heritage. The rooms where colonial administrators once planned the governance of a territory became galleries displaying the country\'s natural wonders and cultural treasures.\n\nThe transformation is more than physical. Where the building once represented foreign control, it now stands as a proud expression of Rwandan identity — a place where citizens and visitors alike can explore the country\'s remarkable biodiversity, ancient artistic traditions, and complex colonial history.',
          fr: 'Quand Kandt a construit cette résidence en 1907, c\'était un symbole d\'autorité coloniale.',
          rw: 'Igihe Kandt yubakaga iyi nzu mu 1907, yari ikimenyetso cy\'ubutegetsi bw\'abakoloni.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: museumExhibition._id,
        title: { en: 'The Future of Heritage: AR Smart Tourism', fr: 'L\'Avenir du Patrimoine : Tourisme Intelligent AR', rw: 'Ejo Hazaza h\'Umuco: Ikoranabuhanga rya AR' },
        content: {
          en: 'In 2025, the Kandt House Museum took a bold step into the future by launching its augmented reality smart tourism system.\n\nVisitors can now use their smartphones to scan QR codes placed next to exhibits throughout the museum. Each scan unlocks a rich digital experience: historical photographs come to life, 3D reconstructions show what colonial-era Kigali looked like, and audio narrations in English, French, and Kinyarwanda provide deeper context about each artifact.\n\nThis technology doesn\'t replace the physical experience — it enhances it. Standing in the same room as Kandt\'s original desk, a visitor can now also see a digital reconstruction of Kandt himself sitting at it, bringing history to life in a way that was impossible before. The museum proves that heritage preservation and technological innovation can work hand in hand.',
          fr: 'En 2025, le musée a lancé son système de réalité augmentée pour enrichir l\'expérience des visiteurs.',
          rw: 'Mu 2025, inzu ndangamurage yashyizeho sisitemu ya AR kugira ngo uburambe bw\'abashyitsi bugwire.',
        },
        status: 'published', order: 2, createdBy: adminUser._id,
      },
    ]);

    // ═══════════════════════════════════════════════════════════════
    // ── 5. Create Trails ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🥾 Creating trails...');

    await Trail.insertMany([
      {
        title: { en: 'The Kandt Heritage Trail', fr: 'Le Sentier du Patrimoine Kandt', rw: 'Inzira y\'Umuco wa Kandt' },
        introduction: {
          en: 'Follow in the footsteps of Dr. Richard Kandt — from his rare 1897 portrait to the writing desk where he governed Kigali, and finally to the golden statue that commemorates his legacy.',
          fr: 'Suivez les traces du Dr Richard Kandt — de son portrait rare de 1897 à son bureau d\'écriture.',
          rw: 'Kurikira intambwe za Dr. Richard Kandt — kuva ku ifoto ye ya 1897 kugeza ku mesa ye y\'ikandiko.',
        },
        description: {
          en: 'A guided journey through the life and legacy of Richard Kandt — the German explorer who founded Kigali. This trail connects three key artifacts that tell his story.',
          fr: 'Un parcours guidé à travers la vie et l\'héritage de Richard Kandt.',
          rw: 'Urugendo ruyobowe mu buzima n\'umuco wa Richard Kandt.',
        },
        stops: [
          { order: 1, artifactId: kandtPortrait._id, description: { en: 'Begin with this rare 1897 photograph — meet the young German doctor before he became an explorer and colonial governor.', fr: 'Commencez par cette photographie rare de 1897.', rw: 'Tangira kuri iyi foto ya 1897 — menya umuganga w\'Umunyaburayi.' } },
          { order: 2, artifactId: kandtDesk._id, description: { en: 'Step inside the museum to see the original desk and fireplace where Kandt administered Kigali and wrote his famous book "Caput Nili."', fr: 'Entrez dans le musée pour voir le bureau original de Kandt.', rw: 'Injira mu nzu ndangamurage urebe ameza Kandt yakoreshaga.' } },
          { order: 3, artifactId: kandtStatue._id, description: { en: 'End at the golden statue outside — a permanent tribute to the man who founded Rwanda\'s capital city.', fr: 'Terminez devant la statue dorée.', rw: 'Rangiza ku gishushanyo cy\'izahabu inyuma.' } },
        ],
        tags: ['kandt', 'history', 'colonial', 'kigali'],
        estimatedMinutes: 20, difficulty: 'easy',
        isFeatured: true, isActive: true, priority: 10,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Rwanda\'s Deadly Reptiles Trail', fr: 'Sentier des Reptiles Mortels du Rwanda', rw: 'Inzira y\'Ibikururuka Bitera Ubwoba' },
        introduction: {
          en: 'Come face-to-face with some of Africa\'s most dangerous reptiles — from a powerful live Nile crocodile to preserved specimens of the Black Mamba and Gaboon Viper.',
          fr: 'Rencontrez certains des reptiles les plus dangereux d\'Afrique.',
          rw: 'Huza imboni n\'ibikururuka bitera ubwoba cyane muri Afurika.',
        },
        description: {
          en: 'An exciting guided tour through the museum\'s reptile collection, from the outdoor crocodile enclosure to the indoor snake specimens.',
          fr: 'Une visite guidée passionnante de la collection de reptiles du musée.',
          rw: 'Urugendo rushimishije mu rusanyirizo rw\'ibikururuka.',
        },
        stops: [
          { order: 1, artifactId: crocodileSpecimen._id, description: { en: 'Start outside at the crocodile enclosure. Watch this apex predator bask in the sun — jaws open, motionless, ancient.', fr: 'Commencez à l\'enclos du crocodile.', rw: 'Tangira ku kibanza cy\'ingona.' } },
          { order: 2, artifactId: blackMamba._id, description: { en: 'Move inside to meet Africa\'s fastest snake. Notice its olive-grey body and the information card describing its deadly speed.', fr: 'Découvrez le serpent le plus rapide d\'Afrique.', rw: 'Menya inzoka yihuta cyane muri Afurika.' } },
          { order: 3, artifactId: gaboonViper._id, description: { en: 'End with the master of disguise. Study the incredible geometric camouflage pattern — can you see how it would vanish on a forest floor?', fr: 'Le maître du camouflage — étudiez son motif géométrique.', rw: 'Inzoka ifite ubwihisho — reba imiterere yayo y\'amabara.' } },
        ],
        tags: ['wildlife', 'reptiles', 'snakes', 'specimens'],
        estimatedMinutes: 15, difficulty: 'easy',
        isFeatured: true, isActive: true, priority: 9,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Colonial Rwanda: Objects & Stories', fr: 'Rwanda Colonial : Objets & Histoires', rw: 'U Rwanda rw\'Abakoloni: Ibintu & Inkuru' },
        introduction: {
          en: 'Explore original colonial-era artifacts that tell the complex story of Rwanda\'s encounter with European colonialism — from rare photographs to imported machinery.',
          fr: 'Explorez les artefacts coloniaux originaux qui racontent l\'histoire complexe du Rwanda.',
          rw: 'Suzuma ibikoresho by\'umwimerere by\'abakoloni biganira inkuru y\'u Rwanda.',
        },
        description: {
          en: 'A guided journey through colonial-era artifacts, furniture, and rare photographs that document life under European rule.',
          fr: 'Un parcours guidé à travers les artefacts de l\'ère coloniale.',
          rw: 'Urugendo ruyobowe mu bikoresho by\'igihe cy\'abakoloni.',
        },
        stops: [
          { order: 1, artifactId: historicalPhotos._id, description: { en: 'Start with the extraordinary high-jump photographs — evidence of a Rwandan athletic tradition that amazed European observers.', fr: 'Commencez par les photographies de saut en hauteur.', rw: 'Tangira ku mafoto yo gusimbuka urukiramende.' } },
          { order: 2, artifactId: kandtDesk._id, description: { en: 'The desk where the colonial governor administered Kigali — imagine the letters and reports written here.', fr: 'Le bureau du gouverneur colonial.', rw: 'Ameza y\'umuyobozi w\'abakoloni.' } },
          { order: 3, artifactId: colonialWheel._id, description: { en: 'This imported industrial wheel represents the technology that colonialism brought to Rwanda.', fr: 'Cette roue importée représente la technologie coloniale.', rw: 'Uru ruziga rugaragaza ikoranabuhanga ry\'abakoloni.' } },
          { order: 4, artifactId: kandtPortrait._id, description: { en: 'End with the man behind it all — the 1897 portrait of Richard Kandt before he came to Rwanda.', fr: 'Terminez avec le portrait de Kandt.', rw: 'Rangiza ku ifoto ya Kandt.' } },
        ],
        tags: ['colonial', 'history', 'artifacts', 'photographs'],
        estimatedMinutes: 25, difficulty: 'moderate',
        isFeatured: true, isActive: true, priority: 8,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Museum Discovery Trail', fr: 'Sentier de Découverte du Musée', rw: 'Inzira yo Gushaka mu Nzu Ndangamurage' },
        introduction: {
          en: 'The complete Kandt House Museum experience — from the historic building and traditional crafts to the wildlife collection and cutting-edge AR technology. The essential trail for first-time visitors.',
          fr: 'L\'expérience complète du Musée Maison Kandt.',
          rw: 'Uburambe bwuzuye bw\'Inzu Ndangamurage ya Kandt.',
        },
        description: {
          en: 'The essential trail covering the museum building, cultural heritage, wildlife, history, and technology in one comprehensive journey.',
          fr: 'Le sentier essentiel couvrant tout le musée.',
          rw: 'Inzira y\'ingenzi igera kuri byose mu nzu ndangamurage.',
        },
        stops: [
          { order: 1, artifactId: museumBuilding._id, description: { en: 'Begin by admiring the museum building itself — the pink colonial residence with turquoise accents that was once the governor\'s house.', fr: 'Admirez le bâtiment du musée.', rw: 'Tangira ureba inyubako y\'inzu ndangamurage.' } },
          { order: 2, artifactId: craftsDisplay._id, description: { en: 'Explore Rwanda\'s artistic heritage — Agaseke baskets, Imigongo art, and traditional pottery.', fr: 'Explorez le patrimoine artistique du Rwanda.', rw: 'Suzuma umuco w\'ubuhanzi bw\'u Rwanda.' } },
          { order: 3, artifactId: crocodileSpecimen._id, description: { en: 'Step outside to the crocodile enclosure — meet one of Africa\'s most powerful predators.', fr: 'Rencontrez le crocodile du Nil.', rw: 'Huza imboni n\'ingona ya Nili.' } },
          { order: 4, artifactId: kandtStatue._id, description: { en: 'Visit the golden statue of Richard Kandt — the founder of Kigali.', fr: 'La statue dorée de Richard Kandt.', rw: 'Igishushanyo cy\'izahabu cya Kandt.' } },
          { order: 5, artifactId: arScanning._id, description: { en: 'Experience the future — scan QR codes to unlock augmented reality content throughout the museum.', fr: 'Scannez les codes QR pour l\'expérience AR.', rw: 'Sikana kode za QR kugira ngo ubone ikoranabuhanga rya AR.' } },
        ],
        tags: ['museum', 'complete', 'guided', 'tour'],
        estimatedMinutes: 45, difficulty: 'easy',
        isFeatured: true, isActive: true, priority: 7,
        createdBy: adminUser._id,
      },
    ]);

    // ── 6. Guides ──
    console.log('\n🧑‍🏫 Creating guides...');
    await Guide.insertMany([
      {
        name: 'Jean Paul Habimana',
        bio: 'Expert in Rwandan colonial history and the story of Richard Kandt. 8+ years guiding at the museum.',
        languages: ['English', 'French', 'Kinyarwanda'],
        specializations: ['Colonial History', 'Natural History', 'Kigali Heritage'],
        userId: guideAccount._id, email: 'jean@museum.rw', isActive: true,
      },
      {
        name: 'Aline Uwamahoro',
        bio: 'Wildlife and conservation specialist with 10 years of experience in biodiversity education.',
        languages: ['English', 'Kinyarwanda'],
        specializations: ['Wildlife', 'Conservation', 'Biodiversity', 'Reptiles'],
        isActive: true,
      },
    ]);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Kandt House Museum of Natural History');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Artifacts:    11 (with correct Cloudinary images)');
    console.log('  Exhibitions:   5 (linked to artifacts)');
    console.log('  Stories:      12 (2-3 per exhibition)');
    console.log('  Trails:        4 (stops reference artifacts)');
    console.log('  Guides:        2');
    console.log('');
    console.log('  Admin: admin@museum.rw / Admin@2026!');
    console.log('  Guide: jean@museum.rw  / Guide@2026!');
    console.log('═══════════════════════════════════════════════════\n');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

importData();
