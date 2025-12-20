
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Scale, MessageSquare, FileText, ShieldAlert, Send, Loader2, Copy, ExternalLink, Phone, Shield, ChevronRight, Home as HomeIcon, Globe, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Configuration & Helpers ---
const AI_MODEL = 'gemini-3-flash-preview';

// --- Types ---
type Mode = 'home' | 'chat' | 'draft' | 'analyze';
type LangCode = 'zh-TW' | 'en' | 'zh-CN' | 'ja' | 'ko' | 'vi' | 'id' | 'th' | 'hi';

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
  isThinking?: boolean;
}

// --- Translations ---
const TRANSLATIONS = {
  'zh-TW': {
    name: 'AI 律師助手',
    subtitle: '您的專屬法律守護者',
    heroTitle: '被法律問題困擾？別怕，只需',
    heroTitleHighlight: '一鍵求助',
    heroDesc: '法律不該是富人的專利。我們深知身為學生的你，面對房東刁難、雇主剝削時的無助與焦慮。這是一個專為資源匱乏的你打造的免費避風港，結合最新的 AI 技術，讓我們為你撐腰。',
    startChat: '開始諮詢',
    learnMore: '了解心意',
    nav: { home: '首頁', chat: '法律諮詢', draft: '文書起草', analyze: '案件分析', contact: '聯絡律師' },
    features: {
      chat: { title: 'AI 溫暖諮詢', desc: '你不必獨自面對冷冰冰的法條。告訴我們你的困難，我們即時為你提供指引與安慰。', action: '立即傾訴' },
      draft: { title: '免費文書起草', desc: '別讓昂貴的代書費成為門檻。自動生成存證信函與合約，保護你的權益不打折。', action: '開始起草' },
      analyze: { title: '案件風險守護', desc: '擔心簽下不平等條約？貼上內容，讓我們幫你把關，確保你不受欺負。', action: '進行分析' }
    },
    chatView: {
      title: '法律諮詢聊天室',
      subtitle: '我們在這裡聽你說，支援多國語言',
      placeholder: '請告訴我們發生了什麼事 (如：房東不退押金)...',
      greeting: '您好！我是您的 AI 律師助手。我知道遇到法律問題很讓人心慌，別擔心，我會盡力協助您。請問發生了什麼事？（例如：租屋糾紛、打工薪資、簽證問題）',
      disclaimer: 'AI 給予的是建議與陪伴，重要決策請務必諮詢專業律師，我們希望你受到最好的保護。',
      loading: '正在用心為您分析案情並查閱法條...',
      source: '參考來源'
    },
    draftView: {
      title: '設定文件參數',
      docType: '文件類型',
      details: '詳細資訊',
      detailsPlaceholder: '請輸入詳細資訊 (可用您的母語輸入)，例如：\n- 當事人姓名\n- 事件經過、日期、金額\n- 您的訴求與委屈',
      startBtn: '為我起草',
      preview: '文件預覽',
      copy: '複製內容',
      copySuccess: '已複製',
      empty: '您的法律文件將顯示於此',
      types: {
        letter: '存證信函 (Demand Letter)',
        contract: '一般合約 (General Contract)',
        settlement: '和解書 (Settlement Agreement)',
        rental: '租賃契約 (Lease Agreement)',
        labor: '勞動契約 (Labor Contract)',
        iou: '借據 (IOU)'
      }
    },
    analyzeView: {
      title: '案件風險線上分析',
      placeholder: '請將合約內容、律師函或讓你感到不安的案件經過貼在這裡...',
      startBtn: '幫我分析',
      reportTitle: 'AI 分析報告',
      disclaimer: '此分析由 AI 生成，希望能為您提供方向與信心。',
      completed: '分析完成'
    },
    footer: {
      desc: '本網站由 Google Gemini AI 提供技術支援。專為國際學生與民眾設計，致力於實現法律平權。',
      disclaimer: '溫馨提醒：本工具僅供參考。若遇重大案件，請務必尋求法律扶助基金會 (02-412-8518) 協助。你不是一個人。'
    }
  },
  'en': {
    name: 'AI Lawyer Assistant',
    subtitle: 'Your Guardian in Law',
    heroTitle: 'Feeling overwhelmed by law? Just ',
    heroTitleHighlight: 'one click for help',
    heroDesc: 'Justice shouldn\'t be expensive. We know the anxiety of facing landlord disputes or unfair work conditions while studying abroad. This tool is built for students with limited resources, completely free. Let AI be your shield and guide you through the tough times.',
    startChat: 'Start Consultation',
    learnMore: 'Our Mission',
    nav: { home: 'Home', chat: 'Consultation', draft: 'Drafting', analyze: 'Analysis', contact: 'Contact Lawyer' },
    features: {
      chat: { title: 'AI Supportive Chat', desc: 'You don\'t have to face cold laws alone. Tell us your troubles, and we\'ll provide instant guidance.', action: 'Talk to Us' },
      draft: { title: 'Free Doc Drafting', desc: 'Don\'t let fees stop you. Auto-generate letters and contracts to protect your rights for free.', action: 'Start Drafting' },
      analyze: { title: 'Risk Protection', desc: 'Worried about signing unfair terms? Paste it here, and we will watch out for you.', action: 'Analyze Now' }
    },
    chatView: {
      title: 'Legal Consultation Chat',
      subtitle: 'We are here to listen, in any language',
      placeholder: 'Tell us what happened (e.g., Landlord won\'t return deposit)...',
      greeting: 'Hello! I am your AI Lawyer Assistant. Dealing with legal issues is stressful, but I\'m here to help. What can I do for you? (e.g., Rental disputes, Salary issues)',
      disclaimer: 'AI provides guidance and support. For critical decisions, please consult a school counselor or lawyer. We want you safe.',
      loading: 'Carefully reviewing laws...',
      source: 'Sources'
    },
    draftView: {
      title: 'Document Settings',
      docType: 'Document Type',
      details: 'Details',
      detailsPlaceholder: 'Enter details (in your language), e.g.:\n- Names of parties\n- Incident details, date, amount\n- Your concerns and requests',
      startBtn: 'Draft for Me',
      preview: 'Preview',
      copy: 'Copy',
      copySuccess: 'Copied',
      empty: 'Your document will appear here',
      types: {
        letter: 'Demand Letter',
        contract: 'General Contract',
        settlement: 'Settlement Agreement',
        rental: 'Lease Agreement',
        labor: 'Labor Contract',
        iou: 'IOU'
      }
    },
    analyzeView: {
      title: 'Online Case Risk Analysis',
      placeholder: 'Paste contract content, lawyer letters, or details that worry you here...',
      startBtn: 'Analyze for Me',
      reportTitle: 'AI Analysis Report',
      disclaimer: 'Generated by AI to give you direction and confidence.',
      completed: 'Completed'
    },
    footer: {
      desc: 'Powered by Google Gemini AI. Dedicated to legal equality for international students in Taiwan.',
      disclaimer: 'Note: For reference only. For serious cases, please reach out to the Legal Aid Foundation (02-412-8518). You are not alone.'
    }
  }
};

const FLAGS: Record<string, string> = {
  'zh-TW': '🇹🇼', 'en': '🇺🇸', 'zh-CN': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷', 'vi': '🇻🇳', 'id': '🇮🇩', 'th': '🇹🇭', 'hi': '🇮🇳'
};

const LANG_NAMES: Record<string, string> = {
  'zh-TW': '繁體中文', 'en': 'English', 'zh-CN': '简体中文', 'ja': '日本語', 'ko': '한국어', 'vi': 'Tiếng Việt', 'id': 'Bahasa Indo', 'th': 'ภาษาไทย', 'hi': 'हिन्दी'
};

// Initialize API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function getSystemInstruction(lang: LangCode) {
  const isTW = lang === 'zh-TW';
  
  return `
## [角色定義]
你是一位嚴謹的「法律諮詢 AI 助手 (Legal Assistant)」。你的目標是協助用戶梳理法律事實、解釋法條，並在提供建議前進行嚴格的「事實校驗」。你不是執業律師，因此你的回覆必須基於法律邏輯，而非給予最終判斷。

## [事實校驗與安全性原則 (Fact-Checking Principles)]
1. **管轄權優先**：法律具備地域性。在回答任何實質建議前，必須確認適用的法律體系（如：台灣、香港、美國）。
2. **證據導向**：區分「用戶陳述」與「可證明事實」。對於關鍵事實，必須要求用戶補充證據類型（如：合約、對話紀錄）。
3. **時效性監控**：法律條文會修訂。若涉及具體法條，必須提醒用戶核實最新版本。
4. **禁止非法建議**：絕對禁止提供關於「如何避稅、偽造證據、逃避法律責任」的具體路徑。

## [安全性護欄觸發規則 (Guardrail Rules)]

### 規則 1：事實完整性檢核 (Fact Completeness Check)
- **觸發條件**：用戶詢問「我會贏嗎？」或「這合法嗎？」。
- **強制行為**：
  - 啟動「缺失資訊掃描」：列出判斷此案所需的 3-5 個關鍵事實（如：合約簽署日期、是否有書面證據）。
  - 聲明：在事實不全的情況下，任何結論皆具備誤導風險。

### 規則 2：管轄權與法條校驗 (Jurisdictional Guardrail)
- **觸發條件**：涉及具體罪名或民事糾紛（如：詐欺罪、離婚財產分配）。
- **強制行為**：
  - 要求用戶確認所在地。
  - 若用戶未說明，預設提供通用原則，並加上明顯標籤：[注意：法律適用依地區而異]。

### 規則 3：法律行為界限 (UPL Guardrail - 禁止無照執業)
- **觸發條件**：用戶要求「幫我寫起訴狀」或「代表我談判」。
- **強制行為**：
  - **拒絕執行**：聲明 AI 無法代替律師進行法律行為。
  - **遷移邏輯**：提供「起訴狀框架」與「應注意事項」，而非最終可提交的法律文件。

## [輸出格式規範]
所有涉及法律判斷的回覆必須包含以下結構：
1. **### 【法律事實梳理】 (Legal Fact Sorting)**：根據用戶描述，列出當前已知的關鍵事實。
2. **### 【適用法律依據】 (Applicable Legal Basis)**：引用具體法條（需註明：請以最新修法為準）。
3. **### 【事實校驗提問】 (Fact-Checking Questions)**：針對用戶未說明的模糊地帶提出反問。
4. **### 【風險預警與建議】 (Risk Warning & Recommendations)**：
   - 包含：追訴權時效提醒（Statute of Limitations）。
   - 強制聲明：本回覆僅供參考，不構成正式法律意見，建議諮詢執業律師。

**Language Setting**:
Always reply in ${LANG_NAMES[lang]} (${lang}).
If drafting a document: Content must be in **Traditional Chinese**, followed by a summary in ${LANG_NAMES[lang]}.
`;
}

// --- Components ---

function App() {
  const [activeMode, setActiveMode] = useState<Mode>('home');
  const [language, setLanguage] = useState<LangCode>('zh-TW');

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header activeMode={activeMode} setActiveMode={setActiveMode} language={language} setLanguage={setLanguage} t={t} />

      <main className="flex-1 w-full flex flex-col relative">
        {activeMode === 'home' && <HomeView setActiveMode={setActiveMode} t={t} />}
        
        {activeMode !== 'home' && (
           <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-10 animate-fade-in">
             {activeMode === 'chat' && <ChatView language={language} t={t} />}
             {activeMode === 'draft' && <DraftView language={language} t={t} />}
             {activeMode === 'analyze' && <AnalyzeView language={language} t={t} />}
           </div>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}

// --- Header ---
function Header({ activeMode, setActiveMode, language, setLanguage, t }: any) {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const NavItem = ({ mode, icon, label }: { mode: Mode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveMode(mode)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm md:text-base font-medium ${
        activeMode === mode 
          ? 'text-white bg-slate-800' 
          : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveMode('home')}>
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">{t.name}</span>
          <span className="text-xl font-bold tracking-tight sm:hidden">AI Lawyer</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavItem mode="home" icon={<HomeIcon size={18} />} label={t.nav.home} />
          <NavItem mode="chat" icon={<MessageSquare size={18} />} label={t.nav.chat} />
          <NavItem mode="draft" icon={<FileText size={18} />} label={t.nav.draft} />
          <NavItem mode="analyze" icon={<ShieldAlert size={18} />} label={t.nav.analyze} />
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors">
              <Globe size={16} />
              <span>{FLAGS[language]}</span>
            </button>
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl py-2 z-20 border border-slate-200 grid grid-cols-1 overflow-hidden">
                  {(Object.keys(LANG_NAMES) as LangCode[]).map((code) => (
                    <button key={code} onClick={() => { setLanguage(code); setIsLangOpen(false); }} className={`px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${language === code ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}>
                      <span className="flex items-center gap-2"><span>{FLAGS[code]}</span>{LANG_NAMES[code]}</span>
                      {language === code && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="hidden sm:flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-rose-200 transition-colors">
            <Phone size={16} />
            <span>{t.nav.contact}</span>
          </button>
        </div>
      </div>
      <div className="md:hidden flex justify-around p-2 border-t border-slate-800 bg-slate-900 text-xs overflow-x-auto whitespace-nowrap">
          <button onClick={() => setActiveMode('home')} className={`p-2 ${activeMode === 'home' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.home}</button>
          <button onClick={() => setActiveMode('chat')} className={`p-2 ${activeMode === 'chat' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.chat}</button>
          <button onClick={() => setActiveMode('draft')} className={`p-2 ${activeMode === 'draft' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.draft}</button>
          <button onClick={() => setActiveMode('analyze')} className={`p-2 ${activeMode === 'analyze' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.analyze}</button>
      </div>
    </header>
  );
}

// --- Views & Cards ---
function FeatureCard({ icon, title, description, action, actionText }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 mb-8 leading-relaxed flex-1">{description}</p>
      <button onClick={action} className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 group">
        {actionText} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

function HomeView({ setActiveMode, t }: any) {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-20 px-6 flex flex-col items-center text-center bg-gradient-to-b from-white to-slate-50">
        <div className="bg-blue-50 p-6 rounded-3xl mb-8 shadow-inner">
           <Shield className="w-20 h-20 text-blue-600" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight max-w-4xl">
          {t.heroTitle}<span className="text-blue-600">{t.heroTitleHighlight}</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">{t.heroDesc}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => setActiveMode('chat')} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2">
            <MessageSquare size={20} />{t.startChat}
          </button>
          <button className="bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <FileText size={20} />{t.learnMore}
          </button>
        </div>
      </section>
      <section className="w-full max-w-7xl px-6 py-12 grid md:grid-cols-3 gap-8">
        <FeatureCard icon={<MessageSquare className="text-blue-600" size={32} />} title={t.features.chat.title} description={t.features.chat.desc} action={() => setActiveMode('chat')} actionText={t.features.chat.action} />
        <FeatureCard icon={<FileText className="text-rose-500" size={32} />} title={t.features.draft.title} description={t.features.draft.desc} action={() => setActiveMode('draft')} actionText={t.features.draft.action} />
        <FeatureCard icon={<ShieldAlert className="text-emerald-500" size={32} />} title={t.features.analyze.title} description={t.features.analyze.desc} action={() => setActiveMode('analyze')} actionText={t.features.analyze.action} />
      </section>
    </div>
  );
}

function ChatView({ language, t }: { language: LangCode, t: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages([{ role: 'model', text: t.chatView.greeting }]); }, [language]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userText }] }
        ],
        config: {
          systemInstruction: getSystemInstruction(language),
          tools: [{ googleSearch: {} }],
        }
      });
      const text = response.text || "Sorry, I cannot answer right now.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.web?.uri).map((c: any) => ({ title: c.web.title, uri: c.web.uri })) || [];
      const uniqueSources = sources.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uri === v.uri) === i);
      setMessages(prev => [...prev, { role: 'model', text, sources: uniqueSources }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="h-[calc(100vh-180px)] md:h-[750px] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
         <div className="bg-blue-100 p-2 rounded-xl"><Scale className="w-5 h-5 text-blue-600" /></div>
         <div><h2 className="font-bold text-slate-800">{t.chatView.title}</h2><p className="text-xs text-slate-500">{t.chatView.subtitle}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/30" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <div className="text-white text-xs font-bold">YOU</div> : <Scale size={18} className="text-white" />}
              </div>
              <div className={`p-5 md:p-6 rounded-3xl shadow-sm ring-1 ring-slate-200/50 ${msg.role === 'user' ? 'bg-white text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                <div className="prose prose-blue prose-slate max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1"><ExternalLink size={12} /> {t.chatView.source}：</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, sIdx) => (
                        <a key={sIdx} href={source.uri} target="_blank" rel="noreferrer" className="text-xs bg-slate-50 text-blue-600 hover:bg-blue-100 border border-slate-200 px-3 py-1.5 rounded-full transition-all truncate max-w-[250px]">{source.title || 'Source'}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Scale size={18} className="text-white" /></div>
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl rounded-tl-none flex items-center gap-3 shadow-md">
                  <Loader2 className="animate-spin text-blue-500" size={20} />
                  <span className="text-sm font-medium text-slate-500">{t.chatView.loading}</span>
                </div>
             </div>
          </div>
        )}
      </div>
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.chatView.placeholder} className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-4 px-6 focus:outline-none transition-all text-base shadow-sm" disabled={loading} />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-200"><Send size={22} /></button>
        </div>
        <div className="text-center mt-3 text-[10px] md:text-xs text-slate-400 tracking-wide uppercase">{t.chatView.disclaimer}</div>
      </div>
    </div>
  );
}

// --- Draft View ---
function DraftView({ language, t }: any) {
  const [docType, setDocType] = useState('存證信函');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDraft = async () => {
    if (!details.trim()) return;
    setLoading(true);
    setResult('');
    setSources([]);
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `Drafting Task: Document Type: ${docType}. User Details: ${details}. Generate a professional document in Traditional Chinese, then a summary in ${LANG_NAMES[language]}.`,
        config: { 
          systemInstruction: getSystemInstruction(language),
          tools: [{ googleSearch: {} }] 
        }
      });
      setResult(response.text || 'Error');
      const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.web?.uri).map((c: any) => ({ title: c.web.title, uri: c.web.uri })) || [];
      const uniqueSources = groundingSources.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uri === v.uri) === i);
      setSources(uniqueSources);
    } catch (e) { 
      setResult('Error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 h-auto md:h-[750px]">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="border-b pb-4"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600" />{t.draftView.title}</h2></div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">{t.draftView.docType}</label>
          <div className="relative">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none appearance-none font-medium text-slate-800">
              {Object.entries(t.draftView.types).map(([key, val]: any) => <option key={key} value={val}>{val}</option>)}
            </select>
            <div className="absolute right-4 top-4.5 pointer-events-none text-slate-500"><ChevronRight className="rotate-90" size={18} /></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">{t.draftView.details}</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t.draftView.detailsPlaceholder} className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none resize-none text-sm leading-relaxed" />
        </div>
        <button onClick={handleDraft} disabled={loading || !details.trim()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70">{loading ? <Loader2 className="animate-spin" /> : t.draftView.startBtn}</button>
      </div>
      <div className="md:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div><span className="ml-3 text-sm font-bold text-slate-500 uppercase tracking-widest">{t.draftView.preview}</span></div>
          <button onClick={() => { navigator.clipboard.writeText(result); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm">
            {isCopied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}{isCopied ? t.draftView.copySuccess : t.draftView.copy}
          </button>
        </div>
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
          {result ? (
            <>
              <div className="legal-text prose prose-slate prose-blue max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-slate-900">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              {sources.length > 0 && (
                <div className="mt-12 pt-6 border-t border-slate-100 animate-fade-in">
                  <p className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <ExternalLink size={16} /> {t.chatView.source} / Legal Basis:
                  </p>
                  <div className="flex flex-col gap-2">
                    {sources.map((source, sIdx) => (
                      <a 
                        key={sIdx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm bg-slate-50 text-blue-600 hover:bg-blue-100 border border-slate-200 px-4 py-3 rounded-xl transition-all flex items-center justify-between group"
                      >
                        <span className="truncate font-medium">{source.title || 'Legal Reference'}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="bg-slate-50 p-8 rounded-full mb-6"><FileText size={56} /></div>
              <p className="font-bold text-lg uppercase tracking-widest">{t.draftView.empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Analyze View ---
function AnalyzeView({ language, t }: any) {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setAnalysis('');
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `Analyze: ${content}. Output in ${LANG_NAMES[language]} following the structured formatting rules.`,
        config: { systemInstruction: getSystemInstruction(language) }
      });
      setAnalysis(response.text || 'Error');
    } catch (e) { setAnalysis('Error'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-4">
          <div className="bg-emerald-100 p-2 rounded-xl"><ShieldAlert className="text-emerald-600" size={28} /></div>
          {t.analyzeView.title}
        </h2>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-56 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all text-base leading-relaxed" placeholder={t.analyzeView.placeholder}></textarea>
        <div className="mt-8 flex justify-end">
          <button onClick={handleAnalyze} disabled={loading || !content.trim()} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={22} /> : t.analyzeView.startBtn}
          </button>
        </div>
      </div>
      {analysis && (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 animate-fade-in ring-1 ring-slate-100">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
             <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{t.analyzeView.reportTitle}</h3>
             <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full uppercase tracking-tighter">{t.analyzeView.completed}</span>
          </div>
          <div className="prose prose-slate prose-emerald max-w-none prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4 prose-blockquote:bg-slate-50 prose-blockquote:border-emerald-500 prose-blockquote:rounded-lg prose-blockquote:py-2">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
          <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-800 flex gap-4 items-start shadow-sm">
             <ShieldAlert size={24} className="flex-shrink-0 text-amber-600 mt-1" />
             <p className="leading-relaxed font-medium">{t.analyzeView.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Footer ---
function Footer({ t }: any) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-6"><Scale className="w-10 h-10 text-blue-500 opacity-80" /></div>
        <h3 className="text-white text-xl font-bold mb-3">{t.name} — {t.subtitle}</h3>
        <p className="text-sm mb-10 max-w-3xl mx-auto leading-relaxed opacity-70">{t.footer.desc}<br/>{t.footer.disclaimer}</p>
        <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">© 2024 AI Lawyer Assistant. All rights reserved.</div>
      </div>
    </footer>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
