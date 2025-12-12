import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Scale, MessageSquare, FileText, ShieldAlert, Send, Loader2, Copy, ExternalLink, Phone, Shield, ChevronRight, Home as HomeIcon, Globe, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Configuration & Helpers ---
const AI_MODEL = 'gemini-2.5-flash';

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
    heroDesc: '法律不該是富人的專利。我們深知身為學生的你，面對房東刁難、雇主剝削時的無助與焦慮。這是一個專為資源匱乏的你打造的免費避風港，結合 Google Gemini 技術，讓我們為你撐腰，陪你度過難關。',
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
      disclaimer: 'AI 給予的是建議與陪伴，重要決策請務必諮詢學校輔導室或專業律師，我們希望你受到最好的保護。',
      loading: '正在用心為您查閱法條...',
      source: '參考來源'
    },
    draftView: {
      title: '設定文件參數',
      docType: '文件類型',
      details: '詳細資訊',
      detailsPlaceholder: '請輸入詳細資訊 (可用您的母語輸入)，例如：\n- 當事人姓名\n- 事件經過、日期、金额\n- 您的訴求與委屈',
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
      desc: '本網站由 Google Gemini AI 提供技術支援。專為在台國際學生與民眾設計，致力於實現法律平權。',
      disclaimer: '溫馨提醒：本工具僅供參考。若遇重大法律案件，請務必尋求專業律師、法律扶助基金會 (02-412-8518) 協助。你不是一個人。'
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
  },
  'zh-CN': {
    name: 'AI 律师助手',
    subtitle: '您的专属法律守护者',
    heroTitle: '被法律问题困扰？别怕，只需',
    heroTitleHighlight: '一键求助',
    heroDesc: '法律不该是富人的专利。我们深知身为学生的你，面对房东刁难、雇主剥削时的无助与焦虑。这是一个专为资源匮乏的你打造的免费避风港，结合 Google Gemini 技术，让我们为你撑腰，陪你度过难关。',
    startChat: '开始咨询',
    learnMore: '了解心意',
    nav: { home: '首页', chat: '法律咨询', draft: '文书起草', analyze: '案件分析', contact: '联络律师' },
    features: {
      chat: { title: 'AI 温暖咨询', desc: '你不必独自面对冷冰冰的法条。告诉我们你的困难，我们即时为你提供指引与安慰。', action: '立即倾诉' },
      draft: { title: '免费文书起草', desc: '别让昂贵的代书费成为门槛。自动生成存证信函与合约，保护你的权益不打折。', action: '开始起草' },
      analyze: { title: '案件风险守护', desc: '担心签下不平等条约？贴上内容，让我们帮你把关，确保你不受欺负。', action: '进行分析' }
    },
    chatView: {
      title: '法律咨询聊天室',
      subtitle: '我们在这里听你说，支援多国语言',
      placeholder: '请告诉我们发生了什么事 (如：房东不退押金)...',
      greeting: '您好！我是您的 AI 律师助手。我知道遇到法律问题很让人心慌，别担心，我会尽力协助您。请问发生了什么事？（例如：租屋纠纷、打工薪资、签证问题）',
      disclaimer: 'AI 给予的是建议与陪伴，重要决策请务必咨询学校辅导室或专业律师，我们希望你受到最好的保护。',
      loading: '正在用心为您查阅法条...',
      source: '参考来源'
    },
    draftView: {
      title: '设定文件参数',
      docType: '文件类型',
      details: '详细资讯',
      detailsPlaceholder: '请输入详细资讯 (可用您的母语输入)，例如：\n- 当事人姓名\n- 事件经过、日期、金额\n- 您的诉求与委屈',
      startBtn: '为我起草',
      preview: '文件预览',
      copy: '复制内容',
      copySuccess: '已复制',
      empty: '您的法律文件将显示于此',
      types: {
        letter: '存证信函 (Demand Letter)',
        contract: '一般合约 (General Contract)',
        settlement: '和解书 (Settlement Agreement)',
        rental: '租赁契约 (Lease Agreement)',
        labor: '劳动契约 (Labor Contract)',
        iou: '借据 (IOU)'
      }
    },
    analyzeView: {
      title: '案件风险在线分析',
      placeholder: '请将合约内容、律师函或让你感到不安的案件经过贴在这里...',
      startBtn: '帮我分析',
      reportTitle: 'AI 分析报告',
      disclaimer: '此分析由 AI 生成，希望能为您提供方向与信心。',
      completed: '分析完成'
    },
    footer: {
      desc: '本网站由 Google Gemini AI 提供技术支援。专为在台国际学生与民众设计，致力于实现法律平权。',
      disclaimer: '温馨提醒：本工具仅供参考。若遇重大法律案件，请务必寻求专业律师、法律扶助基金会 (02-412-8518) 协助。你不是一个人。'
    }
  },
  'ja': {
    name: 'AI 弁護士アシスタント',
    subtitle: 'あなたの法律の守護者',
    heroTitle: '法律トラブルで不安ですか？',
    heroTitleHighlight: 'ワンクリックで助けを',
    heroDesc: '正義は高いものであってはなりません。異国での生活、大家や雇用主とのトラブルに直面する不安を私たちは理解しています。これはリソースが限られた学生のために作られた無料の避難所です。AIがあなたの盾となり、困難を乗り越える手助けをします。',
    startChat: '相談する',
    learnMore: '想いを知る',
    nav: { home: 'ホーム', chat: '法律相談', draft: '文書作成', analyze: '案件分析', contact: '弁護士に連絡' },
    features: {
      chat: { title: 'AI 心の相談', desc: '冷たい法律用語に一人で立ち向かう必要はありません。あなたの悩みを教えてください。', action: '話してみる' },
      draft: { title: '無料文書作成', desc: '費用を気にせず権利を守りましょう。内容証明や契約書を無料で作成します。', action: '作成開始' },
      analyze: { title: 'リスクの見守り', desc: '不当な契約ではないか心配ですか？ここに貼り付けてください。私たちがチェックします。', action: '分析する' }
    },
    chatView: {
      title: '法律相談チャット',
      subtitle: '多言語対応、あなたのお話を聞きます',
      placeholder: '何が起きたか教えてください（例：敷金が返ってこない）...',
      greeting: 'こんにちは。AI弁護士アシスタントです。法律の問題は不安ですよね。でも安心してください、私がついています。どうされましたか？',
      disclaimer: 'AIは助言とサポートを提供します。重要な決定は学校のカウンセラーや弁護士にご相談ください。あなたが守られることを願っています。',
      loading: '心を込めて法律を確認中...',
      source: '情報源'
    },
    draftView: {
      title: '文書設定',
      docType: '文書の種類',
      details: '詳細情報',
      detailsPlaceholder: '詳細を入力してください（日本語可）：\n- 当事者名\n- 経緯、日付、金額\n- あなたの懸念や要望',
      startBtn: '私のために作成',
      preview: 'プレビュー',
      copy: 'コピー',
      copySuccess: 'コピー完了',
      empty: '作成された文書がここに表示されます',
      types: {
        letter: '内容証明郵便 (Demand Letter)',
        contract: '一般契約書 (General Contract)',
        settlement: '和解書 (Settlement Agreement)',
        rental: '賃貸契約書 (Lease Agreement)',
        labor: '労働契約書 (Labor Contract)',
        iou: '借用書 (IOU)'
      }
    },
    analyzeView: {
      title: '案件オンライン・リスク分析',
      placeholder: '契約書の内容、不安に感じる手紙や詳細をここに貼り付けてください...',
      startBtn: '分析をお願い',
      reportTitle: 'AI 分析レポート',
      disclaimer: 'AIによって生成され、あなたに方向性と自信を与えます。',
      completed: '完了'
    },
    footer: {
      desc: 'Google Gemini AI 技術提供。台湾の留学生のために、法律の平等を。',
      disclaimer: '注：参考用です。深刻なケースは法律扶助基金会 (02-412-8518) にご相談ください。あなたは一人ではありません。'
    }
  },
  'ko': {
    name: 'AI 변호사 어시스턴트',
    subtitle: '당신의 든든한 법률 수호자',
    heroTitle: '법률 문제로 막막한가요? ',
    heroTitleHighlight: '클릭 한 번으로 도움을',
    heroDesc: '정의는 비싸지 않아야 합니다. 타지에서 집주인이나 고용주와 갈등을 겪을 때의 불안함을 우리는 잘 압니다. 이 도구는 자원이 부족한 학생들을 위한 무료 피난처입니다. AI가 당신의 방패가 되어 어려운 시기를 함께하겠습니다.',
    startChat: '상담 시작',
    learnMore: '우리의 마음',
    nav: { home: '홈', chat: '법률 상담', draft: '문서 작성', analyze: '사건 분석', contact: '변호사 연락' },
    features: {
      chat: { title: 'AI 따뜻한 상담', desc: '차가운 법률 용어 앞에 혼자 있지 마세요. 고민을 털어놓으세요, 우리가 돕겠습니다.', action: '이야기하기' },
      draft: { title: '무료 문서 작성', desc: '비용 걱정 없이 권리를 지키세요. 내용증명과 계약서를 무료로 작성해 드립니다.', action: '작성 시작' },
      analyze: { title: '위험 지킴이', desc: '부당한 계약일까 걱정되나요? 내용을 붙여넣으세요, 우리가 확인해 드릴게요.', action: '분석하기' }
    },
    chatView: {
      title: '법률 상담 채팅',
      subtitle: '다국어 지원, 당신의 이야기를 듣습니다',
      placeholder: '어떤 일이 있었는지 알려주세요 (예: 보증금 미반환)...',
      greeting: '안녕하세요. AI 변호사 어시스턴트입니다. 법적 문제는 정말 걱정되죠. 안심하세요, 제가 돕겠습니다. 무슨 일이 있으신가요?',
      disclaimer: 'AI는 조언과 지지를 제공합니다. 중요한 결정은 학교 상담사나 변호사와 상의하세요. 당신이 안전하길 바랍니다.',
      loading: '정성을 다해 법률 검토 중...',
      source: '출처'
    },
    draftView: {
      title: '문서 설정',
      docType: '문서 유형',
      details: '상세 정보',
      detailsPlaceholder: '상세 정보를 입력하세요 (한국어 가능):\n- 당사자 이름\n- 사건 경위, 날짜, 금액\n- 당신의 우려 사항',
      startBtn: '나를 위해 작성',
      preview: '미리보기',
      copy: '복사',
      copySuccess: '복사됨',
      empty: '작성된 문서가 여기에 표시됩니다',
      types: {
        letter: '내용증명 (Demand Letter)',
        contract: '일반 계약서 (General Contract)',
        settlement: '합의서 (Settlement Agreement)',
        rental: '임대차 계약서 (Lease Agreement)',
        labor: '근로 계약서 (Labor Contract)',
        iou: '차용증 (IOU)'
      }
    },
    analyzeView: {
      title: '사건 온라인 위험 분석',
      placeholder: '계약서 내용이나 불안한 상황의 세부 내용을 여기에 붙여넣으세요...',
      startBtn: '분석 부탁해',
      reportTitle: 'AI 분석 보고서',
      disclaimer: 'AI가 생성하여 당신에게 방향과 확신을 줍니다.',
      completed: '완료'
    },
    footer: {
      desc: 'Google Gemini AI 기술 지원. 대만 유학생들의 법적 평등을 위해 노력합니다.',
      disclaimer: '참고: 심각한 경우 법률구조재단 (02-412-8518)에 연락하세요. 당신은 혼자가 아닙니다.'
    }
  },
  'vi': {
    name: 'Trợ lý Luật sư AI',
    subtitle: 'Người bảo vệ pháp lý của bạn',
    heroTitle: 'Lo lắng về pháp luật? Chỉ cần ',
    heroTitleHighlight: 'một cú nhấp để cầu cứu',
    heroDesc: 'Công lý không nên đắt đỏ. Chúng tôi hiểu sự lo lắng khi đối mặt với chủ nhà hoặc chủ lao động nơi đất khách. Công cụ này là nơi trú ẩn miễn phí dành cho sinh viên khó khăn. Hãy để AI làm lá chắn và cùng bạn vượt qua khó khăn.',
    startChat: 'Bắt đầu tâm sự',
    learnMore: 'Sứ mệnh',
    nav: { home: 'Trang chủ', chat: 'Tư vấn', draft: 'Soạn thảo', analyze: 'Phân tích', contact: 'Liên hệ Luật sư' },
    features: {
      chat: { title: 'Tư vấn sẻ chia', desc: 'Bạn không phải đối mặt với luật pháp lạnh lùng một mình. Hãy kể cho chúng tôi nghe.', action: 'Trò chuyện' },
      draft: { title: 'Soạn thảo miễn phí', desc: 'Đừng để chi phí ngăn cản bạn. Tạo văn bản bảo vệ quyền lợi hoàn toàn miễn phí.', action: 'Bắt đầu' },
      analyze: { title: 'Bảo vệ rủi ro', desc: 'Lo lắng về hợp đồng bất công? Dán vào đây, chúng tôi sẽ kiểm tra giúp bạn.', action: 'Phân tích' }
    },
    chatView: {
      title: 'Phòng chat Tư vấn Pháp lý',
      subtitle: 'Chúng tôi lắng nghe bạn, bằng mọi ngôn ngữ',
      placeholder: 'Kể cho chúng tôi chuyện gì đã xảy ra (VD: Không trả cọc)...',
      greeting: 'Xin chào. Tôi là Trợ lý Luật sư AI. Gặp vấn đề pháp lý thật lo lắng, nhưng đừng sợ, tôi ở đây để giúp bạn. Có chuyện gì vậy?',
      disclaimer: 'AI cung cấp hướng dẫn và hỗ trợ. Với quyết định quan trọng, hãy tham khảo ý kiến nhà trường hoặc luật sư. Mong bạn bình an.',
      loading: 'Đang tận tâm tra cứu luật...',
      source: 'Nguồn'
    },
    draftView: {
      title: 'Thiết lập văn bản',
      docType: 'Loại văn bản',
      details: 'Chi tiết',
      detailsPlaceholder: 'Nhập chi tiết (có thể dùng tiếng Việt):\n- Tên các bên\n- Diễn biến, ngày tháng, số tiền\n- Lo lắng và yêu cầu của bạn',
      startBtn: 'Soạn cho tôi',
      preview: 'Xem trước',
      copy: 'Sao chép',
      copySuccess: 'Đã sao chép',
      empty: 'Văn bản của bạn sẽ hiện ở đây',
      types: {
        letter: 'Thư yêu cầu (Demand Letter)',
        contract: 'Hợp đồng chung (General Contract)',
        settlement: 'Thỏa thuận hòa giải (Settlement Agreement)',
        rental: 'Hợp đồng thuê nhà (Lease Agreement)',
        labor: 'Hợp đồng lao động (Labor Contract)',
        iou: 'Giấy vay nợ (IOU)'
      }
    },
    analyzeView: {
      title: 'Phân tích rủi ro trực tuyến',
      placeholder: 'Dán nội dung hợp đồng hoặc chi tiết khiến bạn lo lắng vào đây...',
      startBtn: 'Phân tích giúp tôi',
      reportTitle: 'Báo cáo phân tích AI',
      disclaimer: 'Được tạo bởi AI để mang lại phương hướng và niềm tin cho bạn.',
      completed: 'Hoàn tất'
    },
    footer: {
      desc: 'Hỗ trợ bởi Google Gemini AI. Tận tâm vì sự bình đẳng pháp lý cho du học sinh tại Đài Loan.',
      disclaimer: 'Lưu ý: Chỉ để tham khảo. Nếu nghiêm trọng, hãy gọi Quỹ Trợ giúp Pháp lý (02-412-8518). Bạn không cô đơn.'
    }
  },
  'id': {
    name: 'Asisten Pengacara AI',
    subtitle: 'Pelindung Hukum Setia Anda',
    heroTitle: 'Bingung masalah hukum? Cukup ',
    heroTitleHighlight: 'satu klik untuk bantuan',
    heroDesc: 'Keadilan tidak harus mahal. Kami mengerti kecemasan menghadapi sengketa di negeri orang. Alat ini adalah tempat berlindung gratis bagi siswa dengan sumber daya terbatas. Biarkan AI menjadi perisai Anda dan memandu Anda melalui masa-masa sulit.',
    startChat: 'Mulai Curhat',
    learnMore: 'Misi Kami',
    nav: { home: 'Beranda', chat: 'Konsultasi', draft: 'Pembuatan Dokumen', analyze: 'Analisis', contact: 'Hubungi Pengacara' },
    features: {
      chat: { title: 'Konsultasi Hangat', desc: 'Anda tidak sendirian menghadapi hukum yang kaku. Ceritakan masalah Anda pada kami.', action: 'Bicara Sekarang' },
      draft: { title: 'Buat Dokumen Gratis', desc: 'Jangan biarkan biaya menghalangi. Buat surat dan kontrak untuk melindungi hak Anda, gratis.', action: 'Mulai' },
      analyze: { title: 'Perlindungan Risiko', desc: 'Khawatir kontrak tidak adil? Tempel di sini, kami akan menjaganya untuk Anda.', action: 'Analisis' }
    },
    chatView: {
      title: 'Obrolan Konsultasi Hukum',
      subtitle: 'Kami di sini mendengarkan, dalam bahasa apa pun',
      placeholder: 'Ceritakan apa yang terjadi (mis: Masalah deposit)...',
      greeting: 'Halo. Saya Asisten Pengacara AI. Masalah hukum memang menakutkan, tapi tenang saja, saya di sini untuk Anda. Apa yang terjadi?',
      disclaimer: 'AI memberikan panduan dan dukungan. Untuk keputusan penting, konsultasikan dengan sekolah atau pengacara. Kami ingin Anda aman.',
      loading: 'Sedang memeriksa hukum dengan sepenuh hati...',
      source: 'Sumber'
    },
    draftView: {
      title: 'Pengaturan Dokumen',
      docType: 'Jenis Dokumen',
      details: 'Detail',
      detailsPlaceholder: 'Masukkan detail (bisa bahasa Indonesia):\n- Nama pihak\n- Kronologi, tanggal, jumlah uang\n- Kekhawatiran dan permintaan Anda',
      startBtn: 'Buatkan untuk Saya',
      preview: 'Pratinjau',
      copy: 'Salin',
      copySuccess: 'Disalin',
      empty: 'Dokumen Anda akan muncul di sini',
      types: {
        letter: 'Surat Tuntutan (Demand Letter)',
        contract: 'Kontrak Umum (General Contract)',
        settlement: 'Perjanjian Damai (Settlement Agreement)',
        rental: 'Perjanjian Sewa (Lease Agreement)',
        labor: 'Kontrak Kerja (Labor Contract)',
        iou: 'Surat Hutang (IOU)'
      }
    },
    analyzeView: {
      title: 'Analisis Risiko Online Kasus',
      placeholder: 'Tempel isi kontrak atau detail yang membuat Anda cemas di sini...',
      startBtn: 'Bantu Analisis',
      reportTitle: 'Laporan Analisis AI',
      disclaimer: 'Dibuat oleh AI untuk memberi Anda arah dan keyakinan.',
      completed: 'Selesai'
    },
    footer: {
      desc: 'Didukung oleh Google Gemini AI. Berdedikasi untuk kesetaraan hukum bagi pelajar internasional di Taiwan.',
      disclaimer: 'Catatan: Hanya referensi. Untuk kasus serius, hubungi Yayasan Bantuan Hukum (02-412-8518). Anda tidak sendirian.'
    }
  },
  'th': {
    name: 'ผู้ช่วยทนายความ AI',
    subtitle: 'ผู้พิทักษ์ทางกฎหมายของคุณ',
    heroTitle: 'กังวลเรื่องกฎหมาย? เพียง ',
    heroTitleHighlight: 'คลิกเดียวเพื่อขอความช่วยเหลือ',
    heroDesc: 'ความยุติธรรมไม่ควรมีราคาแพง เราเข้าใจความกังวลเมื่อต้องเผชิญปัญหาในต่างแดน เครื่องมือนี้เป็นพื้นที่ปลอดภัยฟรีสำหรับนักเรียนที่มีทรัพยากรจำกัด ให้ AI เป็นโล่และนำทางคุณผ่านช่วงเวลาที่ยากลำบาก',
    startChat: 'เริ่มปรึกษา',
    learnMore: 'ความตั้งใจของเรา',
    nav: { home: 'หน้าแรก', chat: 'ปรึกษา', draft: 'ร่างเอกสาร', analyze: 'วิเคราะห์', contact: 'ติดต่อทนายความ' },
    features: {
      chat: { title: 'ที่ปรึกษาที่เข้าใจคุณ', desc: 'คุณไม่ต้องเผชิญกับกฎหมายที่เย็นชาเพียงลำพัง เล่าปัญหาของคุณให้เราฟัง', action: 'พูดคุยกับเรา' },
      draft: { title: 'ร่างเอกสารฟรี', desc: 'อย่าให้ค่าใช้จ่ายเป็นอุปสรรค สร้างเอกสารปกป้องสิทธิ์ของคุณได้ฟรี', action: 'เริ่มร่าง' },
      analyze: { title: 'ปกป้องความเสี่ยง', desc: 'กังวลเรื่องสัญญาที่ไม่เป็นธรรม? วางที่นี่ เราจะช่วยตรวจสอบให้คุณ', action: 'วิเคราะห์' }
    },
    chatView: {
      title: 'ห้องแชทปรึกษากฎหมาย',
      subtitle: 'เราพร้อมรับฟังคุณ ในทุกภาษา',
      placeholder: 'เล่าให้เราฟังว่าเกิดอะไรขึ้น (เช่น ไม่คืนมัดจำ)...',
      greeting: 'สวัสดี ฉันคือผู้ช่วยทนายความ AI ปัญหากฎหมายน่ากังวล แต่ไม่ต้องกลัว ฉันอยู่ที่นี่เพื่อช่วยคุณ เกิดอะไรขึ้นบ้าง?',
      disclaimer: 'AI ให้คำแนะนำและกำลังใจ สำหรับการตัดสินใจสำคัญ โปรดปรึกษาอาจารย์หรือทนายความ เราอยากให้คุณปลอดภัย',
      loading: 'กำลังตรวจสอบกฎหมายด้วยความใส่ใจ...',
      source: 'แหล่งที่มา'
    },
    draftView: {
      title: 'ตั้งค่าเอกสาร',
      docType: 'ประเภทเอกสาร',
      details: 'รายละเอียด',
      detailsPlaceholder: 'ใส่รายละเอียด (ภาษาไทยได้):\n- ชื่อคู่กรณี\n- เหตุการณ์, วันที่, จำนวนเงิน\n- ความกังวลและคำขอของคุณ',
      startBtn: 'ร่างให้ฉัน',
      preview: 'ตัวอย่าง',
      copy: 'คัดลอก',
      copySuccess: 'คัดลอกแล้ว',
      empty: 'เอกสารของคุณจะแสดงที่นี่',
      types: {
        letter: 'จดหมายทวงถาม (Demand Letter)',
        contract: 'สัญญาเช่าทั่วไป (General Contract)',
        settlement: 'สัญญาประนีประนอม (Settlement Agreement)',
        rental: 'สัญญาเช่า (Lease Agreement)',
        labor: 'สัญญาจ้างงาน (Labor Contract)',
        iou: 'สัญญากู้ยืม (IOU)'
      }
    },
    analyzeView: {
      title: 'วิเคราะห์ความเสี่ยงคดีออนไลน์',
      placeholder: 'วางเนื้อหาสัญญาหรือรายละเอียดที่ทำให้คุณไม่สบายใจที่นี่...',
      startBtn: 'ช่วยวิเคราะห์',
      reportTitle: 'รายงานวิเคราะห์ AI',
      disclaimer: 'สร้างโดย AI เพื่อให้ทิศทางและความมั่นใจแก่คุณ',
      completed: 'เสร็จสิ้น'
    },
    footer: {
      desc: 'สนับสนุนโดย Google Gemini AI มุ่งมั่นเพื่อความเท่าเทียมทางกฎหมายสำหรับนักศึกษาต่างชาติในไต้หวัน',
      disclaimer: 'หมายเหตุ: เพื่อการอ้างอิงเท่านั้น หากร้ายแรง โปรดติดต่อมูลนิธิช่วยเหลือทางกฎหมาย (02-412-8518) คุณไม่ได้ตัวคนเดียว'
    }
  },
  'hi': {
    name: 'AI वकील सहायक',
    subtitle: 'आपका कानूनी रक्षक',
    heroTitle: 'कानूनी समस्याओं से परेशान? बस ',
    heroTitleHighlight: 'मदद के लिए एक क्लिक',
    heroDesc: 'न्याय महंगा नहीं होना चाहिए। हम विदेश में समस्याओं का सामना करने की चिंता को समझते हैं। यह उपकरण सीमित संसाधनों वाले छात्रों के लिए एक मुफ्त आश्रय है। AI को अपनी ढाल बनने दें और कठिन समय में आपका मार्गदर्शन करने दें।',
    startChat: 'बातचीत शुरू करें',
    learnMore: 'हमारा मिशन',
    nav: { home: 'होम', chat: 'परामर्श', draft: 'दस्तावेज़', analyze: 'विश्लेषण', contact: 'वकील से संपर्क करें' },
    features: {
      chat: { title: 'सहायक परामर्श', desc: 'आपको अकेले कानून का सामना नहीं करना है। अपनी परेशानी हमें बताएं।', action: 'हमसे बात करें' },
      draft: { title: 'मुफ्त दस्तावेज़', desc: 'खर्च को बाधा न बनने दें। अपने अधिकारों की रक्षा के लिए मुफ्त में दस्तावेज़ बनाएं।', action: 'शुरू करें' },
      analyze: { title: 'जोखिम सुरक्षा', desc: 'अनुचित अनुबंध के बारे में चिंतित? यहाँ पेस्ट करें, हम आपके लिए इसकी जाँच करेंगे।', action: 'विश्लेषण करें' }
    },
    chatView: {
      title: 'कानूनी परामर्श चैट',
      subtitle: 'हम यहाँ आपकी बात सुनने के लिए हैं',
      placeholder: 'हमें बताएं कि क्या हुआ (जैसे: जमा राशि वापस नहीं मिली)...',
      greeting: 'नमस्ते। मैं आपका AI वकील सहायक हूँ। कानूनी मुद्दे तनावपूर्ण होते हैं, लेकिन डरें नहीं, मैं आपकी मदद के लिए यहाँ हूँ। क्या हुआ?',
      disclaimer: 'AI मार्गदर्शन और सहायता प्रदान करता है। महत्वपूर्ण निर्णयों के लिए, कृपया स्कूल काउंसलर या वकील से सलाह लें। हम चाहते हैं कि आप सुरक्षित रहें।',
      loading: 'ध्यानपूर्वक कानून की समीक्षा की जा रही है...',
      source: 'स्रोत'
    },
    draftView: {
      title: 'दस्तावेज़ सेटिंग्स',
      docType: 'दस्तावेज़ का प्रकार',
      details: 'विवरण',
      detailsPlaceholder: 'विवरण दर्ज करें (हिंदी में हो सकता है):\n- पार्टियों के नाम\n- घटना, तारीख, राशि\n- आपकी चिंताएं और अनुरोध',
      startBtn: 'मेरे लिए ड्राफ्ट करें',
      preview: 'पूर्वावलोकन',
      copy: 'कॉपी करें',
      copySuccess: 'कॉपी किया गया',
      empty: 'आपका दस्तावेज़ यहाँ दिखाई देगा',
      types: {
        letter: 'मांग पत्र (Demand Letter)',
        contract: 'सामान्य अनुबंध (General Contract)',
        settlement: 'समझौता विलेख (Settlement Agreement)',
        rental: 'किरायेदारी समझौता (Lease Agreement)',
        labor: 'श्रम अनुबंध (Labor Contract)',
        iou: 'उधारी नोट (IOU)'
      }
    },
    analyzeView: {
      title: 'मामला ऑनलाइन जोखिम विश्लेषण',
      placeholder: 'अनुबंध सामग्री या विवरण जो आपको चिंतित करते हैं, उन्हें यहाँ पेस्ट करें...',
      startBtn: 'मेरे लिए विश्लेषण करें',
      reportTitle: 'AI विश्लेषण रिपोर्ट',
      disclaimer: 'AI द्वारा आपको दिशा और आत्मविश्वास देने के लिए बनाया गया।',
      completed: 'पूर्ण'
    },
    footer: {
      desc: 'Google Gemini AI द्वारा संचालित। ताइवान में अंतर्राष्ट्रीय छात्रों के लिए कानूनी समानता के लिए समर्पित।',
      disclaimer: 'नोट: केवल संदर्भ के लिए। गंभीर मामलों के लिए, कानूनी सहायता फाउंडेशन (02-412-8518) से संपर्क करें। आप अकेले नहीं हैं।'
    }
  }
};

const FLAGS: Record<LangCode, string> = {
  'zh-TW': '🇹🇼',
  'en': '🇺🇸',
  'zh-CN': '🇨🇳',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'vi': '🇻🇳',
  'id': '🇮🇩',
  'th': '🇹🇭',
  'hi': '🇮🇳'
};

const LANG_NAMES: Record<LangCode, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
  'zh-CN': '简体中文',
  'ja': '日本語',
  'ko': '한국어',
  'vi': 'Tiếng Việt',
  'id': 'Bahasa Indo',
  'th': 'ภาษาไทย',
  'hi': 'हिन्दी'
};

// Initialize API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function getSystemInstruction(lang: LangCode) {
  return `
You are a professional AI Lawyer Assistant helping international students and residents in Taiwan.
Current Language Setting: ${LANG_NAMES[lang]} (${lang}).

Principles:
1. **Language**: ALWAYS Reply in the user's selected language (${LANG_NAMES[lang]}).
2. **Context**: Focus on Taiwan Law (ROC Law).
3. **Drafting**: If asked to draft a legal document:
   - The document CONTENT must be in **Traditional Chinese** (Taiwan standard) to be legally valid.
   - However, provide an **explanation or summary** in the user's language (${LANG_NAMES[lang]}).
   - Format: [Traditional Chinese Document] \n\n --- \n\n [Explanation in ${LANG_NAMES[lang]}].
4. **Tone**: Professional, empathetic, and objective.
5. **Disclaimer**: Always imply that you are AI and users should consult real lawyers for serious cases.
`;
}

// --- Components ---

function App() {
  const [activeMode, setActiveMode] = useState<Mode>('home');
  const [language, setLanguage] = useState<LangCode>('zh-TW');

  // Helper to get translation
  const t = TRANSLATIONS[language];

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
function Header({ activeMode, setActiveMode, language, setLanguage, t }: { 
  activeMode: Mode, 
  setActiveMode: (m: Mode) => void,
  language: LangCode,
  setLanguage: (l: LangCode) => void,
  t: typeof TRANSLATIONS['zh-TW']
}) {
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
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveMode('home')}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">{t.name}</span>
          <span className="text-xl font-bold tracking-tight sm:hidden">AI Lawyer</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem mode="home" icon={<HomeIcon size={18} />} label={t.nav.home} />
          <NavItem mode="chat" icon={<MessageSquare size={18} />} label={t.nav.chat} />
          <NavItem mode="draft" icon={<FileText size={18} />} label={t.nav.draft} />
          <NavItem mode="analyze" icon={<ShieldAlert size={18} />} label={t.nav.analyze} />
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Globe size={16} />
              <span>{FLAGS[language]}</span>
            </button>
            
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl py-2 z-20 border border-slate-200 grid grid-cols-1 overflow-hidden">
                  {(Object.keys(TRANSLATIONS) as LangCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setIsLangOpen(false);
                      }}
                      className={`px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        language === code ? 'bg-blue-50 text-blue-600 font-bold' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{FLAGS[code]}</span>
                        {LANG_NAMES[code]}
                      </span>
                      {language === code && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          <button className="hidden sm:flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-rose-200 transition-colors">
            <Phone size={16} />
            <span>{t.nav.contact}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Nav Bar */}
      <div className="md:hidden flex justify-around p-2 border-t border-slate-800 bg-slate-900 text-xs overflow-x-auto whitespace-nowrap">
          <button onClick={() => setActiveMode('home')} className={`p-2 ${activeMode === 'home' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.home}</button>
          <button onClick={() => setActiveMode('chat')} className={`p-2 ${activeMode === 'chat' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.chat}</button>
          <button onClick={() => setActiveMode('draft')} className={`p-2 ${activeMode === 'draft' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.draft}</button>
          <button onClick={() => setActiveMode('analyze')} className={`p-2 ${activeMode === 'analyze' ? 'text-blue-400' : 'text-slate-400'}`}>{t.nav.analyze}</button>
      </div>
    </header>
  );
}

// --- Footer ---
function Footer({ t }: { t: typeof TRANSLATIONS['zh-TW'] }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-4">
           <Scale className="w-8 h-8 text-blue-500 opacity-80" />
        </div>
        <h3 className="text-white text-lg font-bold mb-2">{t.name} - {t.subtitle}</h3>
        <p className="text-sm mb-6 max-w-2xl mx-auto">
          {t.footer.desc}<br/>
          {t.footer.disclaimer}
        </p>
        <div className="text-xs text-slate-600">
          © 2024 AI Lawyer Assistant. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// --- Home View ---
function HomeView({ setActiveMode, t }: { setActiveMode: (m: Mode) => void, t: typeof TRANSLATIONS['zh-TW'] }) {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-6 flex flex-col items-center text-center bg-gradient-to-b from-white to-slate-50">
        <div className="bg-blue-50 p-6 rounded-3xl mb-8 shadow-inner">
           <Shield className="w-20 h-20 text-blue-600" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight max-w-4xl">
          {t.heroTitle}<span className="text-blue-600">{t.heroTitleHighlight}</span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          {t.heroDesc}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setActiveMode('chat')}
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2"
          >
            <MessageSquare size={20} />
            {t.startChat}
          </button>
          <button 
            className="bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <FileText size={20} />
            {t.learnMore}
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="w-full max-w-7xl px-6 py-12 grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<MessageSquare className="text-blue-600" size={32} />}
          title={t.features.chat.title}
          description={t.features.chat.desc}
          action={() => setActiveMode('chat')}
          actionText={t.features.chat.action}
        />
        <FeatureCard 
          icon={<FileText className="text-rose-500" size={32} />}
          title={t.features.draft.title}
          description={t.features.draft.desc}
          action={() => setActiveMode('draft')}
          actionText={t.features.draft.action}
        />
        <FeatureCard 
          icon={<ShieldAlert className="text-emerald-500" size={32} />}
          title={t.features.analyze.title}
          description={t.features.analyze.desc}
          action={() => setActiveMode('analyze')}
          actionText={t.features.analyze.action}
        />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, action, actionText }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 mb-8 leading-relaxed flex-1">{description}</p>
      <button 
        onClick={action}
        className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 group"
      >
        {actionText} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

// --- Chat Mode ---

function ChatView({ language, t }: { language: LangCode, t: typeof TRANSLATIONS['zh-TW'] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize greeting when language changes or first load
  useEffect(() => {
    setMessages([{ role: 'model', text: t.chatView.greeting }]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri })) || [];

      const uniqueSources = sources.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uri === v.uri) === i);

      setMessages(prev => [...prev, { role: 'model', text, sources: uniqueSources }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] md:h-[700px] flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
         <div className="bg-blue-100 p-2 rounded-full">
            <Scale className="w-5 h-5 text-blue-600" />
         </div>
         <div>
            <h2 className="font-bold text-slate-800">{t.chatView.title}</h2>
            <p className="text-xs text-slate-500">{t.chatView.subtitle}</p>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-600'
              }`}>
                {msg.role === 'user' ? <div className="text-white text-xs">You</div> : <Scale size={14} className="text-white" />}
              </div>

              <div 
                className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <div className="prose prose-sm max-w-none prose-headings:text-slate-700 prose-p:text-slate-600 prose-li:text-slate-600">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                      <ExternalLink size={10} /> {t.chatView.source}：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source, sIdx) => (
                        <a 
                          key={sIdx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs bg-slate-100 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors truncate max-w-[200px]"
                        >
                          {source.title || 'Source'}
                        </a>
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
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Scale size={14} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                  <Loader2 className="animate-spin text-blue-500" size={16} />
                  <span className="text-sm text-slate-500">{t.chatView.loading}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chatView.placeholder}
            className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl py-4 px-6 focus:outline-none transition-all text-base shadow-inner"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-slate-400">
           {t.chatView.disclaimer}
        </div>
      </div>
    </div>
  );
}

// --- Draft Mode ---

function DraftView({ language, t }: { language: LangCode, t: typeof TRANSLATIONS['zh-TW'] }) {
  const [docType, setDocType] = useState('letter');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDraft = async () => {
    if (!details.trim()) return;
    setLoading(true);
    setResult('');

    try {
      const prompt = `
        Drafting Task:
        Document Type: ${docType}
        User Details: ${details}

        Requirements:
        1. Create a professional legal document in **Traditional Chinese** (Taiwan Legal Standard).
        2. Since the user might be an international student, after the Chinese document, provide a summary or translation in **${LANG_NAMES[language]}**.
      `;

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: { systemInstruction: getSystemInstruction(language) }
      });

      setResult(response.text || 'Error generating document.');
    } catch (e) {
      console.error(e);
      setResult('Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[800px] md:h-[650px]">
      {/* Input Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-5 h-full overflow-y-auto">
        <div className="border-b pb-4">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <FileText className="text-blue-600" />
             {t.draftView.title}
           </h2>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.draftView.docType}</label>
          <div className="relative">
             <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none font-medium"
            >
              <option value="存證信函">{t.draftView.types.letter}</option>
              <option value="一般合約">{t.draftView.types.contract}</option>
              <option value="和解書">{t.draftView.types.settlement}</option>
              <option value="租賃契約">{t.draftView.types.rental}</option>
              <option value="勞動契約">{t.draftView.types.labor}</option>
              <option value="借據">{t.draftView.types.iou}</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
               <ChevronRight className="rotate-90" size={16} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t.draftView.details}</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t.draftView.detailsPlaceholder}
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm leading-relaxed"
          />
        </div>

        <button
          onClick={handleDraft}
          disabled={loading || !details.trim()}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" /> : t.draftView.startBtn}
        </button>
      </div>

      {/* Preview Panel */}
      <div className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-400"></div>
             <div className="w-3 h-3 rounded-full bg-amber-400"></div>
             <div className="w-3 h-3 rounded-full bg-green-400"></div>
             <span className="ml-2 text-sm font-semibold text-slate-500">{t.draftView.preview}</span>
          </div>
          <button 
            onClick={handleCopy}
            className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            title="複製"
          >
            {isCopied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />} 
            {isCopied ? t.draftView.copySuccess : t.draftView.copy}
          </button>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {result ? (
            <div className="legal-text text-slate-800 leading-relaxed text-base max-w-3xl mx-auto">
              <div className="prose prose-slate max-w-none prose-headings:font-serif">
                <ReactMarkdown>
                  {result}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                 <FileText size={48} />
              </div>
              <p className="font-medium">{t.draftView.empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Analyze Mode ---

function AnalyzeView({ language, t }: { language: LangCode, t: typeof TRANSLATIONS['zh-TW'] }) {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setAnalysis('');

    try {
       const prompt = `
        Analyze the following legal text or case description.
        Input: ${content}

        Output requirements:
        1. Core legal issues.
        2. Potential risks.
        3. Legal basis (Taiwan Law).
        4. Recommended actions.
        5. Output Language: **${LANG_NAMES[language]}**.
      `;

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: { systemInstruction: getSystemInstruction(language) }
      });

      setAnalysis(response.text || 'Error analyzing.');
    } catch (e) {
      console.error(e);
      setAnalysis('Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
             <ShieldAlert className="text-emerald-600" size={24} />
          </div>
          {t.analyzeView.title}
        </h2>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-base leading-relaxed"
          placeholder={t.analyzeView.placeholder}
        ></textarea>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !content.trim()}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t.analyzeView.startBtn}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
             <h3 className="text-xl font-bold text-slate-800">{t.analyzeView.reportTitle}</h3>
             <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{t.analyzeView.completed}</span>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500 flex gap-3">
             <ShieldAlert size={20} className="flex-shrink-0 text-amber-500" />
             <p>{t.analyzeView.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);