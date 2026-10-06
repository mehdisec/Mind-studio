import { prisma } from '../db';

export interface SampleNodeTemplate {
  tempId: string;
  title: string;
  importance: number;
  note: string;
  posX: number;
  posY: number;
  tags: string[];
  nodeType: string;
  imageUrl?: string;
  imageSize?: string;
  highlighted?: boolean;
  highlightColor?: string;
}

export interface SampleEdgeTemplate {
  sourceTempId: string;
  targetTempId: string;
  label?: string;
  weight?: number;
}

export const SAMPLE_MINDMAP_NODES: SampleNodeTemplate[] = [
  {
    tempId: 'node_business',
    title: 'راه اندازی کسب و کار جدید',
    importance: 9,
    note: '',
    posX: -234,
    posY: -35,
    tags: ['ImageNode'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'red',
  },
  {
    tempId: 'node_central_thoughts',
    title: 'تفکرات من',
    importance: 6,
    note: '',
    posX: -29,
    posY: -139,
    tags: [],
    nodeType: 'image',
    imageUrl: '/profile-portrait.jpg',
    imageSize: 'small',
    highlighted: true,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_meaning_of_life',
    title: 'معنای زندکی',
    importance: 5,
    note: '### 🧠 پرسش‌های بنیادین سقراطی:\n1. آیا «معنا» ویژگی ذاتی و کشف‌شدنی زندگی است، یا صرفاً ابزاری ذهنی است که انسان برای فرار از هراسِ پوچی به جهان تحمیل می‌کند؟\n2. وقتی فرض می‌کنیم زندگی باید «معنایی» داشته باشد تا ارزشمند تلقی شود، بر چه اساسی بی‌معنایی را برابر با بی‌ارزشی می‌دانیم؟ آیا زندگی بدون معنا نمی‌تواند آزادتر و اصیل‌تر باشد؟\n3. اگر معنای زندگی امری کاملاً شخصی و برساخته‌ی خود ماست، چگونه می‌توانیم میان یک معنایِ سازنده و یک توهمِ مخرب یا پوچ، تمایز عقلانی قائل شویم؟\n4. اگر معنای زندگی در رسیدن به اهداف یا غایاتی مشخص نهفته باشد، آیا پس از دستیابی به آن‌ها، زندگی ناگزیر به بی‌معنایی و پوچی محکوم می‌شود؟\n5. آیا جست‌وجوی مداوم و وسواس‌گونه برای «یافتن» معنای زندگی، خود به مانعی بزرگ برای مواجهه بی‌واسطه و واقعی با خودِ «زیستن» تبدیل نمی‌شود؟',
    posX: 90,
    posY: 80,
    tags: ['image'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_validation',
    title: 'اعتبارسنجی ایده کسب‌وکار',
    importance: 9,
    note: 'ارزیابی اولیه ایده برای اطمینان از وجود تقاضای واقعی در بازار و کاهش ریسک شکست اولیه.',
    posX: 22,
    posY: -133,
    tags: ['AI-Branch', 'مبانی'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_model_design',
    title: 'طراحی مدل کسب‌وکار',
    importance: 9,
    note: 'ترسیم ساختار نحوه خلق، ارائه و کسب ارزش مالی از طریق بوم‌های استاندارد مدیریتی.',
    posX: -23,
    posY: -24,
    tags: ['AI-Branch', 'معماری'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_market_research',
    title: 'تحقیقات بازار و شناخت مشتری',
    importance: 8,
    note: 'تحلیل رفتار مشتریان هدف و رقبای موجود برای یافتن جایگاه مناسب و متمایز در بازار.',
    posX: -132,
    posY: 21,
    tags: ['AI-Branch', 'مبانی'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_fundraising',
    title: 'تأمین مالی و جذب سرمایه',
    importance: 8,
    note: 'شناسایی و به‌کارگیری روش‌های مختلف جذب سرمایه مانند سرمایه‌گذاران فرشته، خطرپذیر یا وام‌ها.',
    posX: -241,
    posY: -24,
    tags: ['AI-Branch', 'کاربرد'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_team_building',
    title: 'تیم‌سازی و جذب استعدادها',
    importance: 9,
    note: 'جذب افراد متخصص و هم‌راستا با ارزش‌های سازمان برای پیشبرد اهداف و رشد همه‌جانبه کسب‌وکار.',
    posX: -286,
    posY: -133,
    tags: ['AI-Branch', 'معماری'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_legal',
    title: 'امور حقوقی و مجوزها',
    importance: 7,
    note: 'انجام مراحل قانونی ثبت شرکت، دریافت مجوزهای لازم و تنظیم قراردادها برای پیشگیری از چالش‌های حقوقی.',
    posX: -241,
    posY: -242,
    tags: ['AI-Branch', 'چالش'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_marketing_strategy',
    title: 'استراتژی بازاریابی و فروش',
    importance: 8,
    note: 'برنامه‌ریزی برای معرفی محصول به بازار، جذب اولین مشتریان و ایجاد جریان درآمدی پایدار.',
    posX: -132,
    posY: -287,
    tags: ['AI-Branch', 'کاربرد'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_scaling',
    title: 'مقیاس‌پذیری و توسعه آینده',
    importance: 7,
    note: 'برنامه‌ریزی برای رشد پایدار، ورود به بازارهای جدید و افزایش سهم بازار در مراحل بعدی.',
    posX: -23,
    posY: -242,
    tags: ['AI-Branch', 'آینده'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_meaning_discovery',
    title: 'کشف در برابر خلق معنا',
    importance: 9,
    note: 'بررسی تقابل بنیادین میان معنای ذاتی و کشف‌شدنی جهان با معنای برساخته و شخصی انسان.',
    posX: 154,
    posY: 98,
    tags: ['AI-Branch', 'مبانی'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_meaningless_living',
    title: 'اصالت زیستن بی‌معنا',
    importance: 8,
    note: 'واکاوی این ایده که رهایی از پیش‌فرضِ ضرورتِ معنا، می‌تواند به زندگی آزادتر و اصیل‌تر منجر شود.',
    posX: 96,
    posY: 218,
    tags: ['AI-Branch', 'چالش'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_illusion_distinction',
    title: 'تمایز معنا از توهم',
    importance: 7,
    note: 'تلاش برای یافتن معیارهای عقلانی جهت تفکیک میان معنای سازنده و توهمات مخربِ آرامش‌بخش.',
    posX: -34,
    posY: 248,
    tags: ['AI-Branch', 'معماری'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_teleology_paradox',
    title: 'پارادوکس غایت‌گرایی',
    importance: 8,
    note: 'بررسی این بحران که رسیدن به اهداف نهایی چگونه می‌تواند زندگی را دچار خلاء و بی‌معنایی ثانویه کند.',
    posX: -139,
    posY: 165,
    tags: ['AI-Branch', 'چالش'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_meaning_obsession',
    title: 'وسواس معنایابی',
    importance: 7,
    note: 'تبیین اینکه چگونه جست‌وجوی افراطی برای معنا، مانع از تجربه مستقیم و بی‌واسطه خودِ زندگی می‌شود.',
    posX: -139,
    posY: 31,
    tags: ['AI-Branch', 'کاربرد'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_existential_absurdity',
    title: 'پذیرش اگزیستانسیال پوچی',
    importance: 9,
    note: 'مواجهه فعال و شجاعانه با پوچی جهان به عنوان بستری برای تعریف عاملیت و آزادی انسان.',
    posX: -34,
    posY: -52,
    tags: ['AI-Branch', 'مبانی'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
  {
    tempId: 'node_evolutionary_meaning',
    title: 'کارکرد تکاملی معناسازی',
    importance: 6,
    note: 'تحلیل کارکرد بقامحور ذهن انسان در ساختن مفاهیم معنایی برای سازگاری با هراس‌های وجودی.',
    posX: 96,
    posY: -22,
    tags: ['AI-Branch', 'کاربرد'],
    nodeType: 'text',
    imageUrl: '',
    imageSize: 'small',
    highlighted: false,
    highlightColor: 'gold',
  },
];

export const SAMPLE_MINDMAP_EDGES: SampleEdgeTemplate[] = [
  { sourceTempId: 'node_central_thoughts', targetTempId: 'node_business', label: 'شغل آینده', weight: 1 },
  { sourceTempId: 'node_central_thoughts', targetTempId: 'node_meaning_of_life', label: 'آیده ها', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_validation', label: 'مبانی', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_model_design', label: 'معماری', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_market_research', label: 'مبانی', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_fundraising', label: 'کاربرد', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_team_building', label: 'معماری', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_legal', label: 'چالش', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_marketing_strategy', label: 'کاربرد', weight: 1 },
  { sourceTempId: 'node_business', targetTempId: 'node_scaling', label: 'آینده', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_meaning_discovery', label: 'مبانی', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_meaningless_living', label: 'چالش', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_illusion_distinction', label: 'معماری', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_teleology_paradox', label: 'چالش', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_meaning_obsession', label: 'کاربرد', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_existential_absurdity', label: 'مبانی', weight: 1 },
  { sourceTempId: 'node_meaning_of_life', targetTempId: 'node_evolutionary_meaning', label: 'کاربرد', weight: 1 },
];

/**
 * Seeds the sample mindmap nodes and edges for a newly created page.
 */
export async function seedSampleMindmapForPage(userId: string, pageId: string): Promise<void> {
  try {
    const idMap = new Map<string, string>();

    // 1. Create all nodes
    for (const item of SAMPLE_MINDMAP_NODES) {
      const createdNode = await prisma.node.create({
        data: {
          userId,
          pageId,
          title: item.title,
          importance: item.importance,
          note: item.note,
          posX: item.posX,
          posY: item.posY,
          tags: JSON.stringify(item.tags),
          nodeType: item.nodeType,
          imageUrl: item.imageUrl || '',
          imageSize: item.imageSize || 'small',
          highlighted: Boolean(item.highlighted),
          highlightColor: item.highlightColor || 'gold',
        },
      });
      idMap.set(item.tempId, createdNode.id);
    }

    // 2. Create all edges
    for (const edge of SAMPLE_MINDMAP_EDGES) {
      const sourceNodeId = idMap.get(edge.sourceTempId);
      const targetNodeId = idMap.get(edge.targetTempId);

      if (sourceNodeId && targetNodeId) {
        await prisma.edge.create({
          data: {
            userId,
            pageId,
            sourceNodeId,
            targetNodeId,
            label: edge.label || null,
            weight: edge.weight || 1.0,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error seeding sample mindmap for page:', error);
  }
}
