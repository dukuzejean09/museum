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

// Upload a local image file to Cloudinary
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
    const [
      img1, img2, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, imgHome,
    ] = await Promise.all([
      uploadImage('image (1).jpeg'),
      uploadImage('image (2).jpeg'),
      uploadImage('image (4).jpeg'),
      uploadImage('image (5).jpeg'),
      uploadImage('image (6).jpeg'),
      uploadImage('image (7).jpeg'),
      uploadImage('image (8).jpeg'),
      uploadImage('image (9).jpeg'),
      uploadImage('image (10).jpeg'),
      uploadImage('image (11).jpeg'),
      uploadImage('image (12).jpeg'),
      uploadImage('image (13).jpeg'),
      uploadImage('image (14).jpeg'),
      uploadImage('HomeCt.jpeg'),
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
    // ── 2. Create Artifacts (with Cloudinary images) ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏺 Creating artifacts...');

    const kandtStatue = await Artifact.create({
      title: { en: 'Statue of Richard Kandt', fr: 'Statue de Richard Kandt', rw: 'Igishushanyo cya Richard Kandt' },
      description: {
        en: 'A bronze statue of Dr. Richard Kandt stands at the entrance of the museum. Kandt (1867–1918) was the German physician, explorer, and colonial administrator who founded Kigali as Rwanda\'s administrative capital in 1907.',
        fr: 'Une statue en bronze du Dr Richard Kandt se dresse à l\'entrée du musée. Kandt (1867–1918) était le médecin, explorateur et administrateur colonial allemand qui a fondé Kigali.',
        rw: 'Igishushanyo cy\'umuringa cya Dr. Richard Kandt gihagarara ku muryango w\'inzu ndangamurage. Kandt (1867–1918) yari umuganga, umushakashatsi n\'umuyobozi w\'abakoloni w\'Ubudage washinze Kigali.',
      },
      historicalDetails: {
        en: 'Richard Kandt arrived in East Africa in 1897 searching for the source of the Nile. He identified the Rukarara River as the most distant headwater. In 1907, he was appointed the first Imperial Resident of Rwanda and chose Kigali as his administrative base — founding the city.',
        fr: 'Richard Kandt est arrivé en Afrique de l\'Est en 1897 à la recherche de la source du Nil. Il a identifié la rivière Rukarara comme la source la plus éloignée.',
        rw: 'Richard Kandt yageze muri Afurika y\'Iburasirazuba mu 1897 ashaka isoko ya Nili. Yavumbuye uruzi Rukarara nk\'isoko ya kure cyane.',
      },
      type: 'object', year: '1907',
      coverImage: img1,
      images: [img1, img2].filter(Boolean),
      tags: ['kandt', 'statue', 'colonial', 'history', 'kigali'],
      status: 'published', createdBy: adminUser._id,
    });

    const kandtPortrait = await Artifact.create({
      title: { en: 'Portrait of Richard Kandt', fr: 'Portrait de Richard Kandt', rw: 'Ifoto ya Richard Kandt' },
      description: {
        en: 'A historical photograph of Dr. Richard Kandt, taken during his time in East Africa. The portrait shows Kandt in his explorer\'s attire, reflecting the era of European expeditions into the African interior.',
        fr: 'Une photographie historique du Dr Richard Kandt, prise pendant son séjour en Afrique de l\'Est.',
        rw: 'Ifoto y\'amateka ya Dr. Richard Kandt, yafashwe mu gihe yari muri Afurika y\'Iburasirazuba.',
      },
      type: 'image', year: '1898',
      coverImage: img4,
      images: [img4].filter(Boolean),
      tags: ['kandt', 'portrait', 'photograph', 'colonial'],
      status: 'published', createdBy: adminUser._id,
    });

    const kandtDesk = await Artifact.create({
      title: { en: 'Kandt\'s Writing Desk', fr: 'Bureau d\'Écriture de Kandt', rw: 'Ameza y\'Ikandiko ya Kandt' },
      description: {
        en: 'The original writing desk used by Richard Kandt in his colonial residence. This is where he wrote administrative reports, correspondence, and documented his observations about Rwandan geography and culture.',
        fr: 'Le bureau d\'écriture original utilisé par Richard Kandt dans sa résidence coloniale.',
        rw: 'Ameza y\'ikandiko ya mbere yakoreshejwe na Richard Kandt mu nzu ye y\'abakoloni.',
      },
      historicalDetails: {
        en: 'From this desk, Kandt administered the colonial station of Kigali and wrote his book "Caput Nili" about his expedition to find the source of the Nile.',
        fr: 'Depuis ce bureau, Kandt administrait la station coloniale de Kigali et écrivait son livre "Caput Nili".',
        rw: 'Kuri aya mesa, Kandt yayoboraga ikigo cy\'abakoloni cya Kigali kandi yandika igitabo cye "Caput Nili".',
      },
      type: 'object', year: '1907',
      coverImage: img5,
      images: [img5].filter(Boolean),
      tags: ['kandt', 'furniture', 'colonial', 'desk', 'history'],
      status: 'published', createdBy: adminUser._id,
    });

    const crocodileSpecimen = await Artifact.create({
      title: { en: 'Nile Crocodile Specimen', fr: 'Spécimen de Crocodile du Nil', rw: 'Urugero rw\'Ingona ya Nili' },
      description: {
        en: 'A preserved Nile crocodile (Crocodylus niloticus) specimen — one of the museum\'s most impressive displays. Nile crocodiles can grow up to 6 meters long and live for over 70 years.',
        fr: 'Un spécimen conservé de crocodile du Nil — l\'une des pièces les plus impressionnantes du musée.',
        rw: 'Urugero rw\'ingona ya Nili rwabitswe — kimwe mu bintu bihebuje cyane mu nzu ndangamurage.',
      },
      historicalDetails: {
        en: 'The Nile crocodile has inhabited Rwanda\'s waterways for millions of years. These apex predators play a crucial role in maintaining the ecological balance of lakes and rivers.',
        fr: 'Le crocodile du Nil habite les voies navigables du Rwanda depuis des millions d\'années.',
        rw: 'Ingona ya Nili yabaye mu mazi y\'u Rwanda kuva kera cyane.',
      },
      type: 'specimen',
      coverImage: img6,
      images: [img6, img7].filter(Boolean),
      tags: ['wildlife', 'crocodile', 'specimen', 'reptile', 'nile'],
      status: 'published', createdBy: adminUser._id,
    });

    const blackMamba = await Artifact.create({
      title: { en: 'Black Mamba Specimen', fr: 'Spécimen de Mamba Noir', rw: 'Urugero rwa Black Mamba' },
      description: {
        en: 'A preserved Black Mamba (Dendroaspis polylepis) — Africa\'s fastest and most feared snake. Capable of speeds up to 20 km/h, named for the black interior of its mouth.',
        fr: 'Un Mamba noir conservé — le serpent le plus rapide et le plus redouté d\'Afrique.',
        rw: 'Black Mamba yabitswe — inzoka yihuta cyane kandi iterwa ubwoba cyane muri Afurika.',
      },
      type: 'specimen',
      coverImage: img8,
      images: [img8].filter(Boolean),
      tags: ['wildlife', 'snake', 'mamba', 'specimen', 'reptile'],
      status: 'published', createdBy: adminUser._id,
    });

    const gaboonViper = await Artifact.create({
      title: { en: 'Gaboon Viper Specimen', fr: 'Spécimen de Vipère du Gabon', rw: 'Urugero rwa Gaboon Viper' },
      description: {
        en: 'A preserved Gaboon Viper (Bitis gabonica) — known for having the longest fangs of any venomous snake (up to 5 cm) and its spectacular geometric camouflage pattern.',
        fr: 'Une Vipère du Gabon conservée — connue pour avoir les plus longs crochets de tous les serpents venimeux.',
        rw: 'Gaboon Viper yabitswe — izwi kubera amenyo maremare kurusha izindi nzoka z\'ubumara zose.',
      },
      type: 'specimen',
      coverImage: img9,
      images: [img9].filter(Boolean),
      tags: ['wildlife', 'snake', 'viper', 'specimen', 'reptile'],
      status: 'published', createdBy: adminUser._id,
    });

    const craftsDisplay = await Artifact.create({
      title: { en: 'Rwandan Crafts Collection', fr: 'Collection d\'Artisanat Rwandais', rw: 'Ikusanyirizo ry\'Ubuhanzi bw\'u Rwanda' },
      description: {
        en: 'A curated display of traditional Rwandan crafts including Agaseke peace baskets, Imigongo cow-dung art, pottery, wood carvings, and woven textiles.',
        fr: 'Un ensemble organisé d\'artisanat traditionnel rwandais comprenant les paniers Agaseke, l\'art Imigongo, la poterie.',
        rw: 'Igaragazwa ry\'ubuhanzi gakondo bw\'u Rwanda birimo uduseke Agaseke, ubuhanzi bw\'Imigongo, ibumba.',
      },
      historicalDetails: {
        en: 'The Agaseke basket was designated as a national symbol and is used in the Umushyikirano national dialogue. Imigongo art originated in the Gisaka Kingdom in eastern Rwanda.',
        fr: 'Le panier Agaseke a été désigné comme symbole national. L\'art Imigongo est originaire du Royaume de Gisaka.',
        rw: 'Agaseke yemewe nk\'ikimenyetso cy\'igihugu. Ubuhanzi bw\'Imigongo bwaturutse mu Bwami bwa Gisaka.',
      },
      type: 'object',
      coverImage: img10,
      images: [img10].filter(Boolean),
      tags: ['culture', 'crafts', 'agaseke', 'imigongo', 'tradition', 'art'],
      status: 'published', createdBy: adminUser._id,
    });

    const colonialWheel = await Artifact.create({
      title: { en: 'Colonial-Era Industrial Wheel', fr: 'Roue Industrielle de l\'Ère Coloniale', rw: 'Uruziga rw\'Inganda rw\'Igihe cy\'Abakoloni' },
      description: {
        en: 'An original industrial wheel from the colonial period, imported from Europe during the German administration. Part of the machinery used in early colonial infrastructure projects in Kigali.',
        fr: 'Une roue industrielle originale de la période coloniale, importée d\'Europe pendant l\'administration allemande.',
        rw: 'Uruziga rw\'inganda rw\'umwimerere rwo mu gihe cy\'abakoloni, rwazanywe mu Burayi mu gihe cy\'ubuyobozi bw\'Abadage.',
      },
      type: 'object', year: '1910',
      coverImage: img11,
      images: [img11].filter(Boolean),
      tags: ['colonial', 'industrial', 'machinery', 'german'],
      status: 'published', createdBy: adminUser._id,
    });

    const historicalPhotos = await Artifact.create({
      title: { en: 'Colonial-Era Historical Photographs', fr: 'Photographies Historiques de l\'Ère Coloniale', rw: 'Amafoto y\'Amateka y\'Igihe cy\'Abakoloni' },
      description: {
        en: 'A collection of large-format historical photographs from the colonial period, depicting traditional Rwandan high-jump competitions (gusimbuka urukiramende), cultural ceremonies, and daily life.',
        fr: 'Une collection de photographies historiques grand format de la période coloniale.',
        rw: 'Ikusanyirizo ry\'amafoto manini y\'amateka y\'igihe cy\'abakoloni.',
      },
      type: 'image', year: '1910',
      coverImage: img12,
      images: [img12].filter(Boolean),
      tags: ['colonial', 'photographs', 'history', 'traditions', 'high-jump'],
      status: 'published', createdBy: adminUser._id,
    });

    const museumBuilding = await Artifact.create({
      title: { en: 'The Kandt House Museum Building', fr: 'Le Bâtiment du Musée Maison Kandt', rw: 'Inyubako y\'Inzu Ndangamurage ya Kandt' },
      description: {
        en: 'The museum building itself — a pink-and-turquoise colonial residence with distinctive terracotta roof tiles, built in the early 1900s on a hilltop overlooking the Nyabugogo valley.',
        fr: 'Le bâtiment du musée lui-même — une résidence coloniale rose et turquoise avec des tuiles en terre cuite.',
        rw: 'Inyubako y\'inzu ndangamurage ubwayo — inzu y\'abakoloni y\'umutuku n\'ubururu ifite ibikoresho by\'ibumba.',
      },
      historicalDetails: {
        en: 'After Rwanda gained independence in 1962, the building was transformed from a seat of colonial power into a center for preserving Rwanda\'s natural and cultural heritage.',
        fr: 'Après l\'indépendance du Rwanda en 1962, le bâtiment a été transformé en centre de préservation du patrimoine.',
        rw: 'Nyuma y\'ubwigenge bw\'u Rwanda mu 1962, inyubako yahinduwe ikaba ikigo cyo kubika umuco.',
      },
      type: 'location', year: '1907',
      coverImage: img13,
      images: [img13, imgHome].filter(Boolean),
      tags: ['museum', 'building', 'architecture', 'colonial', 'kigali'],
      status: 'published', createdBy: adminUser._id,
    });

    const arScanning = await Artifact.create({
      title: { en: 'AR Smart Tourism Scanner', fr: 'Scanner de Tourisme Intelligent AR', rw: 'Igikoresho cya AR cyo Gusura' },
      description: {
        en: 'The museum\'s QR-enabled AR smart tourism technology allows visitors to scan codes throughout the building to access immersive digital content, 3D reconstructions, audio narrations, and interactive stories.',
        fr: 'La technologie de tourisme intelligent AR activée par QR du musée permet aux visiteurs de scanner des codes.',
        rw: 'Ikoranabuhanga rya QR-AR ryo gusura inzu ndangamurage rituma abashyitsi basikana kode.',
      },
      type: 'object', year: '2025',
      coverImage: img14,
      images: [img14].filter(Boolean),
      tags: ['technology', 'AR', 'QR', 'digital', 'innovation'],
      status: 'published', createdBy: adminUser._id,
    });

    // ═══════════════════════════════════════════════════════════════
    // ── 3. Create Exhibitions (linked to artifacts — no separate images) ──
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
        fr: 'Découvrez le parcours remarquable du Dr Richard Kandt — l\'explorateur allemand qui a retracé la source du Nil.',
        rw: 'Menya urugendo rutangaje rwa Dr. Richard Kandt — umushakashatsi w\'Ubudage washakishije isoko ya Nili.',
      },
      fullDescription: {
        en: 'Richard Kandt (born Richard Kantorowicz, 1867–1918) was a German physician, explorer, and colonial administrator. In 1897, he arrived in East Africa on a quest to find the true source of the Nile. His expeditions took him through uncharted territories of modern-day Rwanda, where he identified the Rukarara River as the most distant headwater of the Nile. In 1907, he was appointed the first Imperial Resident of Rwanda and established his administrative headquarters in Kigali — effectively founding the city.',
        fr: 'Richard Kandt (né Richard Kantorowicz, 1867–1918) était un médecin, explorateur et administrateur colonial allemand.',
        rw: 'Richard Kandt (wavutse ari Richard Kantorowicz, 1867–1918) yari umuganga, umushakashatsi n\'umuyobozi w\'abakoloni w\'Ubudage.',
      },
      historicalSignificance: {
        en: 'The Kandt House is one of the oldest colonial-era structures in Kigali. It represents a pivotal chapter in Rwanda\'s history.',
        fr: 'La Maison Kandt est l\'une des plus anciennes structures de l\'ère coloniale à Kigali.',
        rw: 'Inzu ya Kandt ni imwe mu nyubako za kera cyane z\'igihe cy\'abakoloni i Kigali.',
      },
      timeline: [
        { year: 1867, event: { en: 'Richard Kantorowicz born in Posen, Prussia', fr: 'Richard Kantorowicz naît à Posen', rw: 'Richard Kantorowicz avukira i Posen' } },
        { year: 1897, event: { en: 'Arrives in East Africa to find the source of the Nile', fr: 'Arrive en Afrique de l\'Est', rw: 'Agera muri Afurika y\'Iburasirazuba' } },
        { year: 1907, event: { en: 'Appointed first Imperial Resident; establishes Kigali', fr: 'Nommé premier Résident impérial', rw: 'Ashyirwaho nk\'Umuturage wa mbere' } },
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
        en: 'Explore Rwanda\'s remarkable reptilian diversity through preserved specimens of crocodiles, venomous snakes, and other species.',
        fr: 'Explorez la remarquable diversité reptilienne du Rwanda.',
        rw: 'Suzuma ubudasa bw\'ibikururuka bwo mu Rwanda.',
      },
      fullDescription: {
        en: 'The Kandt House Museum preserves an extensive collection of Rwanda\'s wildlife specimens, with a particular focus on reptiles. The collection includes Nile crocodiles, the deadly Black Mamba, and the Gaboon Viper.',
        fr: 'Le Musée Maison Kandt conserve une collection extensive de spécimens de la faune rwandaise.',
        rw: 'Inzu Ndangamurage ya Kandt ibika ikusanyirizo rinini ry\'ibinyabuzima byo mu Rwanda.',
      },
      historicalSignificance: {
        en: 'Rwanda\'s natural history collections were first systematically documented during the colonial period.',
        fr: 'Les collections d\'histoire naturelle du Rwanda ont été documentées pendant la période coloniale.',
        rw: 'Ikusanyirizo ry\'amateka y\'ibidukikije byo mu Rwanda ryanditswe mu gihe cy\'abakoloni.',
      },
      timeline: [
        { year: 1925, event: { en: 'Albert National Park established — first in Africa', fr: 'Parc National Albert créé', rw: 'Parike ya Albert yashinzwe' } },
        { year: 1934, event: { en: 'Volcanoes National Park created to protect gorillas', fr: 'Parc des Volcans créé', rw: 'Parike y\'Ibirunga yashinzwe' } },
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
        en: 'Discover the rich artistic traditions of Rwanda — from Agaseke peace baskets to the distinctive Imigongo cow-dung art.',
        fr: 'Découvrez les riches traditions artistiques du Rwanda.',
        rw: 'Menya umuco w\'ubuhanzi w\'u Rwanda.',
      },
      fullDescription: {
        en: 'The museum\'s cultural heritage collection showcases the artistic genius of the Rwandan people. Central to this exhibition is the Agaseke basket and Imigongo art.',
        fr: 'La collection du patrimoine culturel du musée met en valeur le génie artistique du peuple rwandais.',
        rw: 'Ikusanyirizo ry\'umuco gakondo rw\'inzu ndangamurage rigaragaza ubuhanga bw\'ubuhanzi bw\'Abanyarwanda.',
      },
      timeline: [
        { year: 1800, event: { en: 'Imigongo art flourishes in the Gisaka Kingdom', fr: 'L\'art Imigongo prospère', rw: 'Ubuhanzi bw\'Imigongo butera imbere' } },
        { year: 2004, event: { en: 'Agaseke basket adopted as symbol of national unity', fr: 'Agaseke adopté comme symbole', rw: 'Agaseke yemewe nk\'ikimenyetso' } },
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
        en: 'Step back in time through original colonial-era furniture, machinery, and rare historical photographs.',
        fr: 'Remontez dans le temps à travers des meubles d\'époque coloniale.',
        rw: 'Subira mu mateka binyuze mu bikoresho by\'igihe cy\'abakoloni.',
      },
      fullDescription: {
        en: 'This exhibition preserves tangible evidence of the colonial period in Rwanda, spanning German East Africa (1897–1916) and the Belgian mandate era (1916–1962).',
        fr: 'Cette exposition conserve des preuves tangibles de la période coloniale au Rwanda.',
        rw: 'Iki murikagurisha gibika ibimenyetso bigaragara by\'igihe cy\'abakoloni mu Rwanda.',
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
        en: 'From a colonial governor\'s residence to Rwanda\'s premier natural history museum — explore the transformation of this historic building.',
        fr: 'D\'une résidence de gouverneur colonial au premier musée d\'histoire naturelle du Rwanda.',
        rw: 'Kuva mu nzu y\'umuyobozi w\'abakoloni kugeza ku nzu ndangamurage nziza cyane mu Rwanda.',
      },
      fullDescription: {
        en: 'The Kandt House Museum, located on KN 82 Street in Kigali, is housed in the former residence of Dr. Richard Kandt. The museum now features QR-enabled AR smart tourism technology.',
        fr: 'Le Musée Maison Kandt, situé sur la rue KN 82 à Kigali.',
        rw: 'Inzu Ndangamurage ya Kandt, iri ku muhanda wa KN 82 i Kigali.',
      },
      timeline: [
        { year: 1907, event: { en: 'Kandt builds his colonial residence in Kigali', fr: 'Kandt construit sa résidence', rw: 'Kandt yubaka inzu ye i Kigali' } },
        { year: 1962, event: { en: 'Building repurposed for heritage preservation', fr: 'Bâtiment reconverti', rw: 'Inyubako ikoreshwa mu kubika umuco' } },
        { year: 2025, event: { en: 'AR Smart Tourism System launched', fr: 'Système AR lancé', rw: 'Sisitemu ya AR yatangiye' } },
      ],
      artifacts: [museumBuilding._id, arScanning._id, kandtStatue._id],
      accessLevel: 'public_preview', status: 'published', order: 5,
      tags: ['museum', 'building', 'history', 'architecture', 'technology', 'AR'],
      createdBy: adminUser._id,
    });

    // ═══════════════════════════════════════════════════════════════
    // ── 4. Create Stories ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📖 Creating stories...');

    await Story.insertMany([
      {
        exhibitionId: kandtExhibition._id,
        title: { en: 'The Quest for the Source of the Nile', fr: 'La Quête de la Source du Nil', rw: 'Gushaka Isoko ya Nili' },
        content: {
          en: 'In 1897, Richard Kandt set out on one of the most ambitious geographical expeditions of his era — to find the true source of the River Nile. His journey took him through the mountains and valleys of what is now Rwanda. In 1898, he identified the Rukarara River as the most distant headwater of the Nile.',
          fr: 'En 1897, Richard Kandt entreprit l\'une des expéditions géographiques les plus ambitieuses.',
          rw: 'Mu 1897, Richard Kandt yatangiye kimwe mu ngendo z\'ubushakashatsi bwiza cyane.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: wildlifeExhibition._id,
        title: { en: 'Guardians of the Water: Rwanda\'s Nile Crocodiles', fr: 'Gardiens de l\'Eau : Les Crocodiles du Nil', rw: 'Abarinzi b\'Amazi: Ingona za Nili' },
        content: {
          en: 'The Nile crocodile has inhabited Rwanda\'s waterways for millions of years. These apex predators can grow up to 6 meters and live over 70 years.',
          fr: 'Le crocodile du Nil habite les voies navigables du Rwanda depuis des millions d\'années.',
          rw: 'Ingona ya Nili yabaye mu mazi y\'u Rwanda kuva kera cyane.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: cultureExhibition._id,
        title: { en: 'Imigongo: Masterpieces from Cow Dung', fr: 'Imigongo : Chefs-d\'œuvre en Bouse de Vache', rw: 'Imigongo: Ubuhanzi Budasanzwe' },
        content: {
          en: 'Imigongo transforms one of the most humble materials — cow dung — into striking geometric masterpieces. The tradition originated in the Gisaka Kingdom.',
          fr: 'L\'Imigongo transforme la bouse de vache en chefs-d\'œuvre géométriques.',
          rw: 'Imigongo ihindura amase y\'inka mu buhanzi butangaje.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: colonialExhibition._id,
        title: { en: 'Through the Lens: Colonial-Era Rwanda', fr: 'À Travers l\'Objectif : Le Rwanda Colonial', rw: 'Binyuze mu Mafoto: U Rwanda rw\'Abakoloni' },
        content: {
          en: 'The museum houses remarkable large-format photographs from the colonial period, including images of traditional Rwandan high-jump competitions (gusimbuka urukiramende).',
          fr: 'Le musée abrite des photographies remarquables de la période coloniale.',
          rw: 'Inzu ndangamurage ibamo amafoto atangaje y\'igihe cy\'abakoloni.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
      {
        exhibitionId: museumExhibition._id,
        title: { en: 'From Governor\'s House to People\'s Museum', fr: 'De la Maison du Gouverneur au Musée du Peuple', rw: 'Kuva mu Nzu y\'Umuyobozi Kugera ku Nzu Ndangamurage' },
        content: {
          en: 'When Kandt built his residence in the early 1900s, it was a symbol of colonial authority. After independence in 1962, it was transformed into a center for preserving Rwanda\'s heritage.',
          fr: 'La résidence de Kandt était un symbole d\'autorité coloniale.',
          rw: 'Igihe Kandt yubakaga inzu ye, yari ikimenyetso cy\'ubutegetsi bw\'abakoloni.',
        },
        status: 'published', order: 1, createdBy: adminUser._id,
      },
    ]);

    // ═══════════════════════════════════════════════════════════════
    // ── 5. Create Trails (no coverImage — uses artifact images via stops) ──
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🥾 Creating trails...');

    await Trail.insertMany([
      {
        title: { en: 'The Kandt Heritage Trail', fr: 'Le Sentier du Patrimoine Kandt', rw: 'Inzira y\'Umuco wa Kandt' },
        introduction: {
          en: 'Follow in the footsteps of Dr. Richard Kandt — from his portrait and writing desk to the statue that commemorates his legacy as the founder of Kigali.',
          fr: 'Suivez les traces du Dr Richard Kandt.',
          rw: 'Kurikira intambwe za Dr. Richard Kandt.',
        },
        description: {
          en: 'A guided journey through the life and legacy of Richard Kandt, exploring the artifacts that tell the story of Kigali\'s founding.',
          fr: 'Un parcours guidé à travers la vie et l\'héritage de Richard Kandt.',
          rw: 'Urugendo ruyobowe mu buzima n\'umuco wa Richard Kandt.',
        },
        stops: [
          { order: 1, artifactId: kandtPortrait._id, description: { en: 'Meet Richard Kandt through his portrait.', fr: 'Découvrez Richard Kandt à travers son portrait.', rw: 'Menya Richard Kandt binyuze mu ifoto ye.' } },
          { order: 2, artifactId: kandtDesk._id, description: { en: 'The desk where colonial decisions that shaped Kigali were made.', fr: 'Le bureau où les décisions coloniales ont été prises.', rw: 'Ameza aho ibyemezo by\'abakoloni byafatirwaga.' } },
          { order: 3, artifactId: kandtStatue._id, description: { en: 'The statue commemorating Kandt\'s role in founding Rwanda\'s capital.', fr: 'La statue commémorant le rôle de Kandt.', rw: 'Igishushanyo cyibuka uruhare rwa Kandt.' } },
        ],
        tags: ['kandt', 'history', 'colonial', 'kigali'],
        estimatedMinutes: 20, difficulty: 'easy',
        isFeatured: true, isActive: true, priority: 10,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Rwanda\'s Deadly Reptiles Trail', fr: 'Sentier des Reptiles Mortels du Rwanda', rw: 'Inzira y\'Ibikururuka Bitera Ubwoba' },
        introduction: {
          en: 'Come face-to-face with some of Africa\'s most dangerous reptiles.',
          fr: 'Rencontrez certains des reptiles les plus dangereux d\'Afrique.',
          rw: 'Huza imboni n\'ibikururuka bitera ubwoba cyane muri Afurika.',
        },
        description: {
          en: 'An exciting guided tour through the museum\'s reptile specimen collection.',
          fr: 'Une visite guidée passionnante de la collection de spécimens de reptiles.',
          rw: 'Urugendo rushimishije mu rusanyirizo rw\'ibikururuka.',
        },
        stops: [
          { order: 1, artifactId: crocodileSpecimen._id, description: { en: 'The apex predator of Rwanda\'s waterways — the mighty Nile crocodile.', fr: 'Le prédateur suprême des voies navigables.', rw: 'Inyamaswa ikomeye yo mu mazi.' } },
          { order: 2, artifactId: blackMamba._id, description: { en: 'Africa\'s fastest and most feared snake — capable of 20 km/h.', fr: 'Le serpent le plus rapide d\'Afrique.', rw: 'Inzoka yihuta cyane muri Afurika.' } },
          { order: 3, artifactId: gaboonViper._id, description: { en: 'The master of disguise — longest fangs of any venomous snake.', fr: 'Le maître du camouflage.', rw: 'Inzoka ifite amenyo maremare.' } },
        ],
        tags: ['wildlife', 'reptiles', 'snakes', 'specimens'],
        estimatedMinutes: 15, difficulty: 'easy',
        isFeatured: true, isActive: true, priority: 9,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Colonial Rwanda: Objects & Stories', fr: 'Rwanda Colonial : Objets & Histoires', rw: 'U Rwanda rw\'Abakoloni: Ibintu & Inkuru' },
        introduction: {
          en: 'Explore original colonial artifacts that tell the complex story of Rwanda\'s encounter with European colonialism.',
          fr: 'Explorez les artefacts coloniaux originaux.',
          rw: 'Suzuma ibikoresho by\'umwimerere by\'abakoloni.',
        },
        description: {
          en: 'A guided journey through colonial-era artifacts, furniture, machinery, and rare photographs.',
          fr: 'Un parcours guidé à travers les artefacts de l\'ère coloniale.',
          rw: 'Urugendo ruyobowe mu bikoresho by\'igihe cy\'abakoloni.',
        },
        stops: [
          { order: 1, artifactId: historicalPhotos._id, description: { en: 'Rare photographs capturing traditional life.', fr: 'Photographies rares.', rw: 'Amafoto y\'agaciro.' } },
          { order: 2, artifactId: kandtDesk._id, description: { en: 'The desk where the colonial governor administered Kigali.', fr: 'Le bureau du gouverneur colonial.', rw: 'Ameza y\'umuyobozi w\'abakoloni.' } },
          { order: 3, artifactId: colonialWheel._id, description: { en: 'Industrial machinery imported from Europe.', fr: 'Machines importées d\'Europe.', rw: 'Imashini zaturutse mu Burayi.' } },
          { order: 4, artifactId: kandtPortrait._id, description: { en: 'The man behind the colonial administration.', fr: 'L\'homme derrière l\'administration coloniale.', rw: 'Umugabo uyobora ubukoloni.' } },
        ],
        tags: ['colonial', 'history', 'artifacts', 'photographs'],
        estimatedMinutes: 25, difficulty: 'moderate',
        isFeatured: true, isActive: true, priority: 8,
        createdBy: adminUser._id,
      },
      {
        title: { en: 'Museum Discovery Trail', fr: 'Sentier de Découverte du Musée', rw: 'Inzira yo Gushaka mu Nzu Ndangamurage' },
        introduction: {
          en: 'A complete tour of the Kandt House Museum — from the historic building itself to the cutting-edge AR technology.',
          fr: 'Une visite complète du Musée Maison Kandt.',
          rw: 'Urugendo rwuzuye mu Nzu Ndangamurage ya Kandt.',
        },
        description: {
          en: 'The essential museum trail covering the building, crafts, wildlife, and technology.',
          fr: 'Le sentier essentiel du musée.',
          rw: 'Inzira y\'ingenzi y\'inzu ndangamurage.',
        },
        stops: [
          { order: 1, artifactId: museumBuilding._id, description: { en: 'The historic building — from colonial residence to national museum.', fr: 'Le bâtiment historique.', rw: 'Inyubako y\'amateka.' } },
          { order: 2, artifactId: craftsDisplay._id, description: { en: 'Traditional Rwandan arts and crafts — Agaseke and Imigongo.', fr: 'Arts et artisanat traditionnels.', rw: 'Ubuhanzi gakondo bw\'u Rwanda.' } },
          { order: 3, artifactId: crocodileSpecimen._id, description: { en: 'The wildlife collection — Rwanda\'s remarkable biodiversity.', fr: 'La collection de faune.', rw: 'Ikusanyirizo ry\'inyamaswa.' } },
          { order: 4, artifactId: kandtStatue._id, description: { en: 'The founder\'s statue — remembering Kandt\'s legacy.', fr: 'La statue du fondateur.', rw: 'Igishushanyo cy\'umushinze.' } },
          { order: 5, artifactId: arScanning._id, description: { en: 'Experience the future — AR smart tourism technology.', fr: 'Découvrez le futur — technologie AR.', rw: 'Menya igihe kizaza — ikoranabuhanga rya AR.' } },
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
        bio: 'Wildlife and conservation specialist with 10 years of experience.',
        languages: ['English', 'Kinyarwanda'],
        specializations: ['Wildlife', 'Conservation', 'Biodiversity', 'Reptiles'],
        isActive: true,
      },
    ]);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Kandt House Museum of Natural History');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Artifacts:    12 (with Cloudinary images)');
    console.log('  Exhibitions:   5 (linked to artifacts)');
    console.log('  Stories:       5 (linked to exhibitions)');
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
