import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { LanguageService, type AvailableLang } from '@application/services';

interface Language {
  code: AvailableLang;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent {
  private languageService = inject(LanguageService);

  readonly languages: Language[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' }
  ];

  // Computed signal qui suit automatiquement le signal du service
  selectedLanguage = computed(() => {
    const currentLang = this.languageService.currentLang();
    return this.languages.find(lang => lang.code === currentLang) || this.languages[0];
  });

  onLanguageChange(event: any): void {
    const language = event.value as Language;
    if (language?.code) {
      this.languageService.changeLanguage(language.code);
    }
  }
}
