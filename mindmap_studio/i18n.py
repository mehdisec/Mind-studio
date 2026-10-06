"""
Internationalization (i18n) module for MindMap Studio.
Provides bilingual support for Persian (fa) and English (en) with dynamic switching and RTL/LTR handling.
"""

from typing import Dict, Any, Callable, List
from PyQt6.QtCore import QObject, pyqtSignal, Qt
from PyQt6.QtWidgets import QApplication

from mindmap_studio.config import config


TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        # App & Window
        "app_title": "MindMap Studio — Physics Graph & AI Deep-Dive",
        "app_brand": "🧠 MindMap Studio",
        "tab_graph": "🌐 Knowledge Graph",
        "tab_radial": "🧠 AI Deep-Dive Studio",
        
        # Top bar
        "top_thought_lbl": "Thought:",
        "top_thought_placeholder": "Capture a thought, concept, or mental model...",
        "top_importance_lbl": "Importance:",
        "top_add_node_btn": "➕ Add Node",
        "top_quick_save_btn": "💾 Quick Save (Ctrl+S)",
        "top_settings_btn": "⚙️ Settings",
        
        # Canvas toolbar
        "canvas_fit_view": "🎯 Fit View",
        "canvas_reset_view": "↺ Reset Zoom",
        "canvas_physics_on": "⚡ Physics: ON",
        "canvas_physics_off": "⏸ Physics: OFF",
        "canvas_hint": "💡 Space + Drag: Pan Canvas | Drag empty canvas: Box Select | Shift + Drag Node: Link | Delete: Remove",
        
        # Sidebar
        "sidebar_search_title": "🔍 Search Thoughts",
        "sidebar_search_placeholder": "Filter by title or #tags...",
        "sidebar_all_thoughts": "All Captured Thoughts",
        "sidebar_inspector_title": "Thought Inspector",
        "sidebar_no_selection": "None selected",
        "sidebar_select_hint": "Select a node on the canvas to inspect or edit.",
        "sidebar_btn_edit": "📝 Edit Note",
        "sidebar_btn_deep_dive": "🧠 Deep-Dive (Gemini)",
        "sidebar_stats_nodes": "{nodes} Nodes | {edges} Edges",
        "sidebar_stats_title": "📊 Graph Overview",
        "sidebar_total_concepts": "Total Concepts & Nodes",
        "sidebar_details_template": "Importance: ★{importance}/10\nTags: {tags}\nLinks: {links} connected thoughts\nNotes: {chars} chars",
        "sidebar_tags_none": "None",

        # Image Node Editor
        "editor_group_image": "🖼️ Image Node Settings",
        "editor_btn_change_image": "🔄 Change Image",
        "editor_btn_attach_image": "🖼️ Attach Image",
        "editor_btn_remove_image": "❌ Remove Image (Convert to Text)",
        "editor_lbl_image_size": "Image Size:",
        "editor_size_small": "Small (1x)",
        "editor_size_medium": "Medium (2x)",
        "editor_size_large": "Large (3x)",

        # Bottom AI Chat & Notebook Assistant Panel
        "ai_chat_title": "🤖 AI Notebook & Knowledge Graph Assistant",
        "ai_chat_badge_connected": "📚 Notebook: {notes} Notes & {nodes} Nodes Active",
        "ai_chat_placeholder": "Ask anything about your notes, or say 'Add a node about X', 'Delete node Y'...",
        "ai_chat_send": "Send",
        "ai_chat_clear": "Clear Chat",
        "ai_chat_welcome_title": "🧠 Welcome to your AI Notebook Assistant!",
        "ai_chat_welcome_body": "I have full access to your **Obsidian Vault notes** and **Knowledge Graph**. You can:\n- Ask questions and synthesize ideas across your notes.\n- Tell me to **add, link, or delete nodes** directly on your graph.\n- Explore hidden associations and Socratic reflections.",
        "ai_chat_quick_brainstorm": "💡 Brainstorm Ideas",
        "ai_chat_quick_deep_dive": "🔍 Deep Analysis",
        "ai_chat_quick_socratic": "❓ Socratic Review",
        "ai_chat_quick_connect": "🔗 Discover Links",
        "ai_chat_brainstorm_no_node_title": "Select Node to Brainstorm",
        "ai_chat_brainstorm_no_node_msg": "Please select a node on the knowledge graph first to brainstorm and expand ideas specifically for that node.",
        "ai_action_confirm_title": "Confirm Graph Modifications",
        "ai_action_declined": "Graph modifications were cancelled by user.",
        "action_review_title": "Review & Confirm Proposed Ideas",
        "action_review_subtitle": "The AI has proposed the following nodes and links. Select the items you wish to add to the graph:",
        "action_review_select_all": "Select All",
        "action_review_deselect_all": "Deselect All",
        "action_review_selected_count": "{selected} of {total} items selected",
        "action_review_btn_apply": "✅ Apply Selected to Graph",
        "action_review_btn_cancel": "Cancel",
        "action_review_no_selection_warn": "No items are selected. Do you want to cancel without making changes?",
        "action_review_connects_to": "Connects to",
        "action_review_tags": "Tags",
        "action_review_importance": "Importance",
        "ai_action_add": "Create Node",
        "ai_action_delete": "Delete Node",
        "ai_action_connect": "Connect Nodes",
        "ai_action_added_node": "➕ Created node: **[[{title}]]** (★{importance})",
        "ai_action_deleted_node": "🗑️ Deleted node: **'{title}'**",
        "ai_action_connected_nodes": "🔗 Connected: **[[{src}]]** ↔ **[[{tgt}]]**",
        "ai_action_failed": "⚠️ Action failed: {error}",
        "ai_chat_active_model": "⚡ Active Model: {model}",
        "ai_chat_thinking": "💭 Thinking...",
        
        # Cortex 3D & Live Voice
        "cortex_btn_start_live": "🎙️ Live Voice",
        "cortex_btn_stop_live": "⏹️ Stop Voice",
        "cortex_btn_mute": "🔇 Mute",
        "cortex_btn_unmute": "🎤 Unmute",
        "cortex_btn_interrupt": "⚡ Interrupt",
        "cortex_status_idle": "AI Cortex Ready",
        "cortex_status_live": "Live Voice Active",
        "cortex_need_api_key": "Please set a valid Gemini API Key in Settings to start Live Voice.",
        
        # Bottom Note Content Panel (Legacy compatibility)
        "note_panel_title_lbl": "📝 Title:",
        "note_panel_title_placeholder": "Select a node on the graph...",
        "note_panel_importance_lbl": "Importance:",
        "note_panel_tags_lbl": "Tags:",
        "note_panel_tags_placeholder": "tag1, tag2",
        "note_panel_editor_placeholder": "Select any node on the graph to view and edit its Obsidian markdown notes here...\n\nSupports full Markdown, [[Wikilinks]], bullet points, tasks, and headers.",
        "note_panel_status_loaded": "📁 Loaded from Obsidian",
        "note_panel_status_idle": "Click node to view",
        "note_panel_btn_highlight": "☆ Highlight",
        "note_panel_btn_highlighted": "⭐ Highlighted",
        "note_panel_btn_highlight_gold": "⭐ Gold Highlight",
        "note_panel_btn_highlight_red": "🔴 Red Highlight",
        "note_panel_btn_highlight_green": "🟢 Green Highlight",
        "note_panel_btn_save": "💾 Save Note (Ctrl+S)",
        "note_panel_btn_deep_dive": "🧠 Deep-Dive",
        "note_panel_btn_socratic": "❓ Socratic Qs",

        # Status bar messages
        "status_ready": "Ready. Add a thought or press Ctrl+S to sync.",
        "status_vault_not_set": "📁 Vault: Not Set",
        "status_vault_connected": "📁 Vault: {name}",
        "status_thought_added": "Added thought: '{topic}'.",
        "status_link_connected": "🔗 Connected '{src}' ↔ '{tgt}'",
        "status_link_selected": "🔗 Selected link: [[{src}]] ↔ [[{tgt}]] — Press Delete or Backspace to remove.",
        "status_link_removed": "✂️ Removed link: [[{src}]] ↔ [[{tgt}]]",
        "status_node_deleted": "Deleted '{title}' permanently.",
        "status_note_updated": "Updated and synced '{title}'.",
        "status_note_saved": "Saved note for '{title}'.",
        "status_saved_sync": "Saved to Obsidian and persistent storage.",
        "status_settings_updated": "Settings updated successfully.",
        
        # AI & Socratic
        "ai_connecting": "Connecting to Gemini ({model})...",
        "ai_analyzing": "🧠 Gemini AI analyzing '{title}'...",
        "ai_socratic_thinking": "❓ Formulating Socratic questions for '{title}'...",
        "ai_socratic_complete": "❓ Added {count} Socratic questions to '{title}'.",
        "ai_deep_dive_complete": "Gemini analysis complete for '{title}'. Generated {count} insights & {soc_count} Socratic questions.",
        "ai_deep_dive_failed": "AI Deep-Dive failed.",
        "ai_socratic_failed": "Socratic inquiry failed.",
        "ai_socratic_prompt_dialog_title": "❓ Socratic Questions Generated",
        "ai_socratic_prompt_dialog_body": "Formulated {count} Socratic questions for '{title}':\n\n{preview}\n\nQuestions have been appended to your Obsidian Note.\nWould you also like to add them as exploratory thought nodes on the Knowledge Graph?",
        "ai_socratic_section_header": "## ❓ Socratic Questions for Deep Reflection:",
        "ai_socratic_section_fa": "## ❓ Socratic Questions (پرسش‌های سقراطی برای تفکر عمیق‌تر):",

        # Radial / AI Deep-Dive Studio
        "radial_title": "🧠 AI Deep-Dive: '{topic}' ({count} Insights)",
        "radial_merge_btn": "➕ Merge All to Main Graph",
        "radial_export_btn": "💾 Export to Note",
        "radial_tab_inspector": "🔍 Inspector",
        "radial_tab_socratic": "❓ Socratic Qs ({count})",
        "radial_node_meta": "Importance: ★{importance}/10  |  Tags: {tags}",
        "radial_soc_desc": "Challenging Socratic questions for deeper dialectic reflection:",
        "radial_soc_empty": "No Socratic questions generated yet.",
        "radial_card_q": "<b>❓ Q{i}:</b> {question}",
        "radial_card_btn_add": "➕ Add as Thought",
        "radial_card_btn_copy": "📋 Copy",
        "radial_copied_title": "Copied",
        "radial_copied_body": "Question copied to clipboard!",
        "radial_merge_success": "Merged {count} insights into Knowledge Graph!",
        "radial_export_success_title": "Exported Successfully",
        "radial_export_success_body": "Saved breakdown note with Socratic questions to:\n{filename}",

        # Context Menus
        "menu_add_text_node": "➕  Add Text Node",
        "menu_add_image_node": "🖼️  Add Image Node...",
        "menu_add_edit_note": "📝  Add / Edit Note (Markdown)",
        "menu_deep_dive": "🧠  AI Deep-Dive (Gemini)",
        "menu_socratic": "❓  Socratic Questions",
        "menu_highlight": "⭐  Highlight Thought",
        "menu_highlight_menu": "🎨  Highlight Node",
        "menu_highlight_gold": "⭐  Gold (Default)",
        "menu_highlight_red": "🔴  Red",
        "menu_highlight_green": "🟢  Green",
        "menu_remove_highlight": "❌  Remove Highlight",
        "menu_connect": "🔗  Connect to Node (or Shift+Drag)...",
        "menu_disconnect": "✂️  Disconnect Link...",
        "menu_disconnect_from": "Disconnect from [[{title}]]",
        "menu_pin": "📌  Pin Position",
        "menu_unpin": "📍  Unpin Position",
        "menu_delete_thought": "🗑️  Delete Thought",
        "menu_delete_link": "🗑️  Delete Link: [[{src}]] ↔ [[{tgt}]]",

        # Image Node Dialogs
        "dialog_select_image_title": "Select Image for Node",
        "dialog_image_files_filter": "Images (*.png *.jpg *.jpeg *.webp *.bmp *.gif *.svg);;All Files (*.*)",
        "dialog_image_node_title_window": "Image Node Details",
        "dialog_image_node_title_prompt": "Enter a title/label for this Image Node:",
        "dialog_image_size_label": "Node Size:",
        "image_size_small": "Small (1x — Base Size)",
        "image_size_medium": "Medium (2x)",
        "image_size_large": "Large (3x — Maximum)",
        "dialog_add_image_btn": "➕ Add Image Node",
        "dialog_text_node_title_window": "New Node",
        "dialog_text_node_title_prompt": "Enter a title for this new node:",
        "status_image_node_added": "Added image node: '{title}'.",
        
        # Edge Tooltip
        "edge_tooltip": "🔗 Link: {src} ↔ {tgt}\n(Click to select | Press Delete to remove)",

        # Context Menu
        "menu_add_child_text": "➕ Add Sub-Node (Text)",
        "menu_add_child_image": "🖼️ Add Sub-Node (Image)",
        "menu_edit_edge_label": "🏷️ Edit Link Label / Tag",
        "dialog_add_subnode_title": "Add New Sub-Node",
        "dialog_add_subnode_prompt": "Enter topic/title for the new sub-node:",
        "dialog_edit_edge_label_title": "Edit Link Label",
        "dialog_edit_edge_label_prompt": "Enter connection label (or tag name):",
        "status_link_label_updated": "Link label updated.",

        # Note Editor Dialog
        "editor_dialog_title": "Note Editor — {title}",
        "editor_group_props": "Node Properties",
        "editor_lbl_topic": "Topic:",
        "editor_placeholder_topic": "Enter concept or thought title...",
        "editor_lbl_importance": "Importance:",
        "editor_lbl_tags": "Tags:",
        "editor_placeholder_tags": "Comma-separated tags (e.g. mental-model, architecture, ideas)",
        "editor_group_content": "Markdown Content (Obsidian Synced)",
        "editor_btn_insert_image": "🖼️ Insert Image into Note",
        "editor_dialog_insert_image_title": "Select Image to Insert",
        "editor_dialog_image_caption_prompt": "Image Alt Text / Description:",
        "editor_placeholder_content": "# Detailed Brain Dump & Notes\n\nWrite your markdown notes, bullet points, mental models, or references here...",
        "editor_stats_template": "{words} words | {chars} characters | Node ID: {id}",
        "editor_btn_deep_dive": "🧠 AI Deep-Dive",
        "editor_btn_socratic": "❓ Socratic Qs",
        "editor_btn_cancel": "Cancel",
        "editor_btn_save": "💾 Save & Sync (Ctrl+S)",
        "editor_invalid_title_title": "Invalid Title",
        "editor_invalid_title_body": "Please provide a title for this thought.",

        # Settings Dialog
        "settings_dialog_title": "MindMap Studio Settings",
        "settings_group_lang": "Language & Localization / زبان برنامه",
        "settings_lbl_lang": "Interface Language (زبان رابط کاربری):",
        "settings_group_theme": "Theme & Appearance / ظاهر و تم",
        "settings_lbl_theme": "Application Theme (تم برنامه):",
        "settings_theme_dark": "🌙 Dark Theme (تم تاریک)",
        "settings_theme_light": "☀️ Light Theme (تم روشن)",
        "settings_group_ai": "Google Gemini AI Configuration",
        "settings_lbl_api_key": "Gemini API Key:",
        "settings_placeholder_api_key": "Paste your GEMINI_API_KEY here...",
        "settings_btn_show": "👁 Show",
        "settings_btn_hide": "🔒 Hide",
        "settings_lbl_model": "Model:",
        "settings_group_vault": "Obsidian Vault Integration",
        "settings_lbl_vault_path": "Active Vault Path:",
        "settings_placeholder_vault": "Select an Obsidian Vault folder...",
        "settings_btn_browse": "📁 Browse...",
        "settings_group_pref": "Preferences",
        "settings_chk_physics": "Enable Real-Time Force-Directed Physics Simulation",
        "settings_btn_cancel": "Cancel",
        "settings_btn_save": "Save Settings",
        "settings_btn_test_api": "🔌 Test API Connection",
        "settings_api_test_ok": "✅ API Connection Successful! Model responded.",
        "settings_api_test_fail": "❌ API Connection Failed:\n{error}",
        "settings_custom_model_hint": "Type custom model name or select from list...",
        "settings_invalid_path_title": "Invalid Path",
        "settings_invalid_path_body": "The specified Obsidian Vault path does not exist.",
        
        # Confirmation Dialogs
        "confirm_delete_title": "Confirm Delete",
        "confirm_delete_body": "Thought '{title}' contains notes.\nAre you sure you want to delete it?",
        "confirm_remove_ai_node_body": "Remove '{title}' from this AI analysis?",
        "notice_root_node_delete": "The root concept node cannot be deleted.",
        "dialog_connect_vault_title": "Connect Obsidian Vault",
        "dialog_connect_vault_body": "No Obsidian Vault directory has been configured.\nWould you like to select your Obsidian Vault folder now?"
    },

    "fa": {
        # App & Window
        "app_title": "مایند‌مپ استودیو — گراف دانش فیزیک‌محور و تحلیل هوش مصنوعی",
        "app_brand": "🧠 استودیو مایند‌مپ",
        "tab_graph": "🌐 گراف دانش (Knowledge Graph)",
        "tab_radial": "🧠 استودیو تحلیل عمیق (Deep-Dive)",
        
        # Top bar
        "top_thought_lbl": "ایده / موضوع:",
        "top_thought_placeholder": "یک ایده، مفهوم یا مدل ذهنی وارد کنید...",
        "top_importance_lbl": "اهمیت:",
        "top_add_node_btn": "➕ افزودن نود",
        "top_quick_save_btn": "💾 ذخیره سریع (Ctrl+S)",
        "top_settings_btn": "⚙️ تنظیمات",
        
        # Canvas toolbar
        "canvas_fit_view": "🎯 تنظیم دید (Fit View)",
        "canvas_reset_view": "↺ بزرگنمایی پیش‌فرض",
        "canvas_physics_on": "⚡ فیزیک: روشن",
        "canvas_physics_off": "⏸ فیزیک: خاموش",
        "canvas_hint": "💡 کلید اسپیس + درگ: جابجایی صفحه (Pan) | درگ در فضای خالی: انتخاب گروهی نودها | کلید Shift + درگ: اتصال | Delete: حذف",
        
        # Sidebar
        "sidebar_search_title": "🔍 جستجوی موضوعات",
        "sidebar_search_placeholder": "فیلتر با عنوان یا #برچسب...",
        "sidebar_all_thoughts": "تمام موضوعات ثبت‌شده",
        "sidebar_inspector_title": "مشخصات موضوع",
        "sidebar_no_selection": "موردی انتخاب نشده",
        "sidebar_select_hint": "برای مشاهده یا ویرایش، روی یک نود در بوم کلیک کنید.",
        "sidebar_btn_edit": "📝 ویرایش یادداشت",
        "sidebar_btn_deep_dive": "🧠 تحلیل عمیق (Gemini)",
        "sidebar_stats_nodes": "{nodes} نود | {edges} اتصال",
        "sidebar_stats_title": "📊 آمار و اطلاعات گراف",
        "sidebar_total_concepts": "مجموع مفاهیم و نودها",
        "sidebar_details_template": "اهمیت: ★{importance}/10\nبرچسب‌ها: {tags}\nاتصالات: {links} ایده متصل\nیادداشت: {chars} کاراکتر",
        "sidebar_tags_none": "بدون برچسب",

        # Image Node Editor
        "editor_group_image": "🖼️ مشخصات و تنظیمات تصویر",
        "editor_btn_change_image": "🔄 تغییر تصویر",
        "editor_btn_attach_image": "🖼️ پیوست تصویر",
        "editor_btn_remove_image": "❌ حذف تصویر (تبدیل به متنی)",
        "editor_lbl_image_size": "اندازه تصویر:",
        "editor_size_small": "کوچک (1x)",
        "editor_size_medium": "متوسط (2x)",
        "editor_size_large": "بزرگ (3x)",

        # Bottom AI Chat & Notebook Assistant Panel
        "ai_chat_title": "🤖 دستیار هوشمند گراف و دفترچه یادداشت ابسیدین",
        "ai_chat_badge_connected": "📚 دفترچه: {notes} یادداشت و {nodes} نود متصل",
        "ai_chat_placeholder": "درباره یادداشت‌ها بپرسید، یا بگویید «یک نود درباره X بساز»، «نود Y را حذف کن»...",
        "ai_chat_send": "ارسال",
        "ai_chat_clear": "پاک‌سازی گفتگو",
        "ai_chat_welcome_title": "🧠 به دستیار هوشمند و دفترچه یادداشت خود خوش آمدید!",
        "ai_chat_welcome_body": "من به تمامی **یادداشت‌های والت ابسیدین** و **گراف دانش** شما دسترسی دارم. شما می‌توانید:\n- درباره ایده‌ها و یادداشت‌های خود سوال بپرسید و آن‌ها را تحلیل و سنتز کنید.\n- به من دستور دهید مستقیماً نودهای جدیدی **اضافه، متصل یا حذف** کنم.\n- الگوها، اتصالات پنهان و پرسش‌های نقادانه سقراطی را کشف کنید.",
        "ai_chat_quick_brainstorm": "💡 ایده‌پردازی و توسعه گراف",
        "ai_chat_quick_deep_dive": "🔍 تحلیل عمیق",
        "ai_chat_quick_socratic": "❓ تحلیل سقراطی",
        "ai_chat_quick_connect": "🔗 کشف اتصالات",
        "ai_chat_brainstorm_no_node_title": "انتخاب نود برای ایده‌پردازی",
        "ai_chat_brainstorm_no_node_msg": "لطفاً ابتدا یک نود را روی گراف انتخاب کنید تا ایده‌پردازی و توسعه صرفاً در مورد آن انجام شود.",
        "ai_action_confirm_title": "تایید توسعه و تغییرات گراف",
        "ai_action_declined": "اعمال تغییرات روی گراف توسط کاربر لغو شد.",
        "action_review_title": "بررسی و تایید ایده‌های پیشنهادی",
        "action_review_subtitle": "هوش مصنوعی نودها و اتصالات زیر را پیشنهاد داده است. موارد دلخواه را برای اضافه شدن به گراف تیک بزنید:",
        "action_review_select_all": "انتخاب همه",
        "action_review_deselect_all": "لغو انتخاب همه",
        "action_review_selected_count": "{selected} از {total} مورد انتخاب شده است",
        "action_review_btn_apply": "✅ تایید و اعمال روی گراف",
        "action_review_btn_cancel": "انصراف",
        "action_review_no_selection_warn": "هیچ موردی انتخاب نشده است. آیا مایلید پنجره بدون تغییر بسته شود؟",
        "action_review_connects_to": "اتصالات",
        "action_review_tags": "برچسب‌ها",
        "action_review_importance": "اهمیت",
        "ai_action_add": "ایجاد نود",
        "ai_action_delete": "حذف نود",
        "ai_action_connect": "اتصال نودها",
        "ai_action_added_node": "➕ نود جدید ایجاد شد: **[[{title}]]** (★{importance})",
        "ai_action_deleted_node": "🗑️ نود حذف شد: **'{title}'**",
        "ai_action_connected_nodes": "🔗 اتصال برقرار شد: **[[{src}]]** ↔ **[[{tgt}]]**",
        "ai_action_failed": "⚠️ عملیات ناموفق: {error}",
        "ai_chat_active_model": "⚡ مدل فعال: {model}",
        "ai_chat_thinking": "💭 Thinking... (در حال تفکر)",
        
        # Cortex 3D & Live Voice
        "cortex_btn_start_live": "🎙️ گفتگوی صوتی زنده",
        "cortex_btn_stop_live": "⏹️ توقف مکالمه",
        "cortex_btn_mute": "🔇 قطع میکروفون",
        "cortex_btn_unmute": "🎤 فعال‌سازی میکروفون",
        "cortex_btn_interrupt": "⚡ قطع صحبت",
        "cortex_status_idle": "کورتکس هوش مصنوعی آماده",
        "cortex_status_live": "مکالمه زنده صوتی فعال است",
        "cortex_need_api_key": "لطفاً ابتدا در بخش تنظیمات کلید معتبر Gemini API را وارد کنید.",
        
        # Bottom Note Content Panel (Legacy compatibility)
        "note_panel_title_lbl": "📝 عنوان:",
        "note_panel_title_placeholder": "یک نود را روی گراف انتخاب کنید...",
        "note_panel_importance_lbl": "اهمیت:",
        "note_panel_tags_lbl": "برچسب‌ها:",
        "note_panel_tags_placeholder": "برچسب۱, برچسب۲",
        "note_panel_editor_placeholder": "روی هر نود در گراف کلیک کنید تا یادداشت‌های مارک‌داون ابسیدین آن را در اینجا مشاهده و ویرایش کنید...\n\nپشتیبانی کامل از مارک‌داون، [[ویکی‌لینک‌ها]]، لیست‌ها، وظایف و تیترها.",
        "note_panel_status_loaded": "📁 بارگذاری‌شده از ابسیدین",
        "note_panel_status_idle": "برای مشاهده روی نود کلیک کنید",
        "note_panel_btn_highlight": "☆ هایلایت",
        "note_panel_btn_highlighted": "⭐ هایلایت‌شده",
        "note_panel_btn_highlight_gold": "⭐ هایلایت طلایی",
        "note_panel_btn_highlight_red": "🔴 هایلایت قرمز",
        "note_panel_btn_highlight_green": "🟢 هایلایت سبز",
        "note_panel_btn_save": "💾 ذخیره یادداشت (Ctrl+S)",
        "note_panel_btn_deep_dive": "🧠 تحلیل عمیق",
        "note_panel_btn_socratic": "❓ سوالات سقراطی",

        # Status bar messages
        "status_ready": "آماده. یک ایده اضافه کنید یا کلید Ctrl+S را برای همگام‌سازی فشار دهید.",
        "status_vault_not_set": "📁 والت ابسیدین: تنظیم نشده",
        "status_vault_connected": "📁 والت ابسیدین: {name}",
        "status_thought_added": "موضوع اضافه شد: '{topic}'.",
        "status_link_connected": "🔗 اتصال برقرار شد: '{src}' ↔ '{tgt}'",
        "status_link_selected": "🔗 اتصال انتخاب شد: [[{src}]] ↔ [[{tgt}]] — کلید Delete یا Backspace را برای حذف فشار دهید.",
        "status_link_removed": "✂️ اتصال حذف شد: [[{src}]] ↔ [[{tgt}]]",
        "status_node_deleted": "موضوع '{title}' برای همیشه حذف شد.",
        "status_note_updated": "موضوع '{title}' به‌روزرسانی و همگام شد.",
        "status_note_saved": "یادداشت '{title}' ذخیره شد.",
        "status_saved_sync": "در والت ابسیدین و دیتابیس ذخیره شد.",
        "status_settings_updated": "تنظیمات با موفقیت ذخیره و اعمال شد.",
        
        # AI & Socratic
        "ai_connecting": "در حال اتصال به جمینای ({model})...",
        "ai_analyzing": "🧠 هوش مصنوعی در حال تحلیل موضوع '{title}'...",
        "ai_socratic_thinking": "❓ در حال طراحی پرسش‌های سقراطی برای '{title}'...",
        "ai_socratic_complete": "❓ تعداد {count} پرسش سقراطی به '{title}' اضافه شد.",
        "ai_deep_dive_complete": "تحلیل هوش مصنوعی برای '{title}' پایان یافت. تعداد {count} زیرمفهوم و {soc_count} پرسش سقراطی تولید شد.",
        "ai_deep_dive_failed": "تحلیل عمیق هوش مصنوعی انجام نشد.",
        "ai_socratic_failed": "طراحی پرسش‌های سقراطی انجام نشد.",
        "ai_socratic_prompt_dialog_title": "❓ پرسش‌های سقراطی تولید شد",
        "ai_socratic_prompt_dialog_body": "تعداد {count} پرسش سقراطی برای '{title}' طراحی شد:\n\n{preview}\n\nپرسش‌ها به فایل یادداشت ابسیدین افزوده شدند.\nآیا مایلید این پرسش‌ها به عنوان نودهای تفکر جدید روی گراف دانش نیز ترسیم شوند؟",
        "ai_socratic_section_header": "## ❓ Socratic Questions for Deep Reflection:",
        "ai_socratic_section_fa": "## ❓ Socratic Questions (پرسش‌های سقراطی برای تفکر عمیق‌تر):",

        # Radial / AI Deep-Dive Studio
        "radial_title": "🧠 تحلیل عمیق هوش مصنوعی: '{topic}' ({count} زیرمفهوم)",
        "radial_merge_btn": "➕ ادغام همه در گراف اصلی",
        "radial_export_btn": "💾 خروجی به یادداشت ابسیدین",
        "radial_tab_inspector": "🔍 مشخصات نود",
        "radial_tab_socratic": "❓ پرسش‌های سقراطی ({count})",
        "radial_node_meta": "اهمیت: ★{importance}/10  |  برچسب‌ها: {tags}",
        "radial_soc_desc": "پرسش‌های چالش‌برانگیز سقراطی برای تفکر عمیق‌تر و نقد فرضیات:",
        "radial_soc_empty": "هنوز پرسش سقراطی تولید نشده است.",
        "radial_card_q": "<b>❓ سوال {i}:</b> {question}",
        "radial_card_btn_add": "➕ افزودن به عنوان نود",
        "radial_card_btn_copy": "📋 کپی",
        "radial_copied_title": "کپی شد",
        "radial_copied_body": "متن پرسش در کلیپ‌بورد کپی شد!",
        "radial_merge_success": "تعداد {count} مفهوم جدید به گراف اصلی افزوده شد!",
        "radial_export_success_title": "خروجی با موفقیت ذخیره شد",
        "radial_export_success_body": "یادداشت تحلیل همراه با پرسش‌های سقراطی در فایل زیر ذخیره شد:\n{filename}",

        # Context Menus
        "menu_add_text_node": "➕  افزودن نود متنی",
        "menu_add_image_node": "🖼️  افزودن نود تصویری (انتخاب فایل)...",
        "menu_add_edit_note": "📝  مشاهده / ویرایش یادداشت (مارک‌داون)",
        "menu_deep_dive": "🧠  تحلیل عمیق هوش مصنوعی (Gemini)",
        "menu_socratic": "❓  طرح پرسش‌های سقراطی (Socratic Questions)",
        "menu_highlight": "⭐  هایلایت موضوع",
        "menu_highlight_menu": "🎨  هایلایت نود",
        "menu_highlight_gold": "⭐  طلایی (پیش‌فرض)",
        "menu_highlight_red": "🔴  قرمز",
        "menu_highlight_green": "🟢  سبز",
        "menu_remove_highlight": "❌  حذف هایلایت",
        "menu_connect": "🔗  اتصال به نود دیگر (یا Shift+Drag)...",
        "menu_disconnect": "✂️  قطع اتصال...",
        "menu_disconnect_from": "قطع اتصال از [[{title}]]",
        "menu_pin": "📌  ثابت کردن موقعیت (Pin)",
        "menu_unpin": "📍  آزاد کردن موقعیت (Unpin)",
        "menu_delete_thought": "🗑️  حذف موضوع",
        "menu_delete_link": "🗑️  حذف اتصال: [[{src}]] ↔ [[{tgt}]]",

        # Image Node Dialogs
        "dialog_select_image_title": "انتخاب تصویر برای نود تصویری",
        "dialog_image_files_filter": "تصاویر (*.png *.jpg *.jpeg *.webp *.bmp *.gif *.svg);;همه فایل‌ها (*.*)",
        "dialog_image_node_title_window": "مشخصات نود تصویری",
        "dialog_image_node_title_prompt": "عنوان یا برچسب این نود تصویری را وارد کنید:",
        "dialog_image_size_label": "اندازه نود تصویری:",
        "image_size_small": "کوچک (اندازه پایه — ۱x)",
        "image_size_medium": "متوسط (۲x)",
        "image_size_large": "بزرگ (حداکثر — ۳ برابر)",
        "dialog_add_image_btn": "➕ افزودن نود تصویری",
        "dialog_text_node_title_window": "نود جدید",
        "dialog_text_node_title_prompt": "عنوان این نود را وارد کنید:",
        "status_image_node_added": "نود تصویری افزوده شد: '{title}'.",
        
        # Edge Tooltip
        "edge_tooltip": "🔗 اتصال: {src} ↔ {tgt}\n(برای انتخاب کلیک کنید | کلید Delete برای حذف)",

        # Context Menu
        "menu_add_child_text": "➕ افزودن زیرشاخه متنی",
        "menu_add_child_image": "🖼️ افزودن زیرشاخه تصویری",
        "menu_edit_edge_label": "🏷️ ویرایش برچسب اتصال / تگ",
        "dialog_add_subnode_title": "افزودن زیرشاخه جدید",
        "dialog_add_subnode_prompt": "عنوان یا موضوع زیرشاخه جدید را وارد کنید:",
        "dialog_edit_edge_label_title": "ویرایش برچسب اتصال",
        "dialog_edit_edge_label_prompt": "برچسب یا تگ اتصال را وارد کنید:",
        "status_link_label_updated": "برچسب اتصال به‌روزرسانی شد.",

        # Note Editor Dialog
        "editor_dialog_title": "ویرایشگر یادداشت — {title}",
        "editor_group_props": "مشخصات موضوع",
        "editor_lbl_topic": "موضوع:",
        "editor_placeholder_topic": "عنوان مفهوم یا موضوع را وارد کنید...",
        "editor_lbl_importance": "اهمیت:",
        "editor_lbl_tags": "برچسب‌ها:",
        "editor_placeholder_tags": "برچسب‌های جداشده با ویرگول (مانند: مدل-ذهنی، ایده)",
        "editor_group_content": "محتوای مارک‌داون (همگام با ابسیدین)",
        "editor_btn_insert_image": "🖼️ درج تصویر در متن یادداشت",
        "editor_dialog_insert_image_title": "انتخاب تصویر برای درج در یادداشت",
        "editor_dialog_image_caption_prompt": "توضیحات تصویر (Alt Text):",
        "editor_placeholder_content": "# یادداشت‌ها و جزئیات فکری\n\nنکات، مدل‌های ذهنی، ارجاعات و ساختارهای خود را اینجا بنویسید...",
        "editor_stats_template": "{words} کلمه | {chars} کاراکتر | شناسه نود: {id}",
        "editor_btn_deep_dive": "🧠 تحلیل عمیق",
        "editor_btn_socratic": "❓ سوالات سقراطی",
        "editor_btn_cancel": "انصراف",
        "editor_btn_save": "💾 ذخیره و همگام‌سازی (Ctrl+S)",
        "editor_invalid_title_title": "عنوان نامعتبر",
        "editor_invalid_title_body": "لطفاً برای این موضوع یک عنوان وارد کنید.",

        # Settings Dialog
        "settings_dialog_title": "تنظیمات استودیو مایند‌مپ",
        "settings_group_lang": "زبان و محلی‌سازی / Language & Localization",
        "settings_lbl_lang": "زبان رابط کاربری (Interface Language):",
        "settings_group_theme": "ظاهر و تم برنامه / Theme & Appearance",
        "settings_lbl_theme": "تم برنامه (Application Theme):",
        "settings_theme_dark": "🌙 تم تاریک (Dark Theme)",
        "settings_theme_light": "☀️ تم روشن (Light Theme)",
        "settings_group_ai": "تنظیمات هوش مصنوعی Google Gemini",
        "settings_lbl_api_key": "کلید اختصاصی API جمینای (Gemini API Key):",
        "settings_placeholder_api_key": "کلید GEMINI_API_KEY خود را اینجا وارد کنید...",
        "settings_btn_show": "👁 نمایش",
        "settings_btn_hide": "🔒 مخفی",
        "settings_lbl_model": "مدل هوش مصنوعی:",
        "settings_group_vault": "اتصال به والت نرم‌افزار ابسیدین (Obsidian Vault)",
        "settings_lbl_vault_path": "مسیر پوشه والت ابسیدین:",
        "settings_placeholder_vault": "پوشه والت ابسیدین را انتخاب کنید...",
        "settings_btn_browse": "📁 انتخاب پوشه...",
        "settings_group_pref": "ترجیحات گراف و شبیه‌سازی",
        "settings_chk_physics": "فعال‌سازی شبیه‌سازی فیزیک بلادرنگ (Force-Directed Physics)",
        "settings_btn_cancel": "انصراف",
        "settings_btn_save": "ذخیره تنظیمات",
        "settings_btn_test_api": "🔌 تست اتصال به API",
        "settings_api_test_ok": "✅ اتصال با موفقیت برقرار شد! مدل پاسخ داد.",
        "settings_api_test_fail": "❌ برقراری ارتباط با API ناموفق بود:\n{error}",
        "settings_custom_model_hint": "نام مدل دلخواه را بنویسید یا از لیست انتخاب کنید...",
        "settings_invalid_path_title": "مسیر نامعتبر",
        "settings_invalid_path_body": "مسیر والت ابسیدین مشخص شده وجود ندارد.",
        
        # Confirmation Dialogs
        "confirm_delete_title": "تأیید حذف",
        "confirm_delete_body": "موضوع '{title}' حاوی یادداشت است.\nآیا از حذف دائمی آن اطمینان دارید؟",
        "confirm_remove_ai_node_body": "آیا موضوع '{title}' از این تحلیل هوش مصنوعی حذف شود؟",
        "notice_root_node_delete": "نود ریشه و اصلی قابل حذف نیست.",
        "dialog_connect_vault_title": "اتصال والت ابسیدین",
        "dialog_connect_vault_body": "هیچ پوشه‌ای برای والت ابسیدین تنظیم نشده است.\nآیا مایلید اکنون پوشه والت ابسیدین خود را انتخاب کنید؟"
    }
}


class I18nManager(QObject):
    """Singleton manager for application language and translation lookup."""
    language_changed = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self._current_lang = config.get_language()
        if self._current_lang not in ("fa", "en"):
            self._current_lang = "fa"

    def get_language(self) -> str:
        return self._current_lang

    def set_language(self, lang: str):
        if lang not in ("fa", "en"):
            lang = "fa"
        if self._current_lang != lang:
            self._current_lang = lang
            config.set_language(lang)
            self._apply_layout_direction()
            self.language_changed.emit(lang)

    def _apply_layout_direction(self):
        """Applies Qt layout direction based on current language."""
        app = QApplication.instance()
        if app:
            if self._current_lang == "fa":
                app.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
            else:
                app.setLayoutDirection(Qt.LayoutDirection.LeftToRight)

    def t(self, key: str, **kwargs) -> str:
        """Translates a key into the current language, formatting any keyword arguments."""
        lang_dict = TRANSLATIONS.get(self._current_lang, TRANSLATIONS["fa"])
        text = lang_dict.get(key)
        if text is None:
            # Fallback to English, then key itself
            text = TRANSLATIONS["en"].get(key, key)
        if kwargs:
            try:
                return text.format(**kwargs)
            except Exception:
                return text
        return text


# Global i18n instance
i18n = I18nManager()


def t(key: str, **kwargs) -> str:
    """Convenience global translation function."""
    return i18n.t(key, **kwargs)
