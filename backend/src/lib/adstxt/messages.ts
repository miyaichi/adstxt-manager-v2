/**
 * Message system for ads-txt-validator
 */

import enValidation from './locales/en/validation.json';
import jaValidation from './locales/ja/validation.json';
import { Severity } from './types';

export interface ValidationMessage {
  key: string;
  severity: Severity;
  message: string;
  description?: string;
  helpUrl?: string;
  placeholders: string[];
}

export interface MessageData {
  message: string;
  description?: string;
  helpUrl?: string;
}

export interface MessageProvider {
  getMessage(key: string, locale?: string): MessageData | null;
  formatMessage(key: string, placeholders: string[], locale?: string): ValidationMessage | null;
}

// Message resources
const messages = {
  ja: jaValidation,
  en: enValidation,
} as const;

export type SupportedLocale = keyof typeof messages;

export interface MessageConfig {
  defaultLocale?: SupportedLocale;
  baseUrl?: string;
}

export class DefaultMessageProvider implements MessageProvider {
  private defaultLocale: SupportedLocale = 'ja';
  private baseUrl?: string;

  constructor(defaultLocale: SupportedLocale = 'ja', config?: MessageConfig) {
    this.defaultLocale = config?.defaultLocale || defaultLocale;
    this.baseUrl = config?.baseUrl;
  }

  getMessage(key: string, locale?: string): MessageData | null {
    const targetLocale = (locale as SupportedLocale) || this.defaultLocale;
    const messageBundle = messages[targetLocale] || messages[this.defaultLocale];

    const messageData = messageBundle.validation_errors[key as keyof typeof messageBundle.validation_errors];

    if (!messageData) {
      return null;
    }

    return {
      message: messageData.message,
      description: messageData.description,
      helpUrl: this.formatHelpUrl(messageData.helpUrl),
    };
  }

  private formatHelpUrl(helpUrl?: string): string | undefined {
    if (!helpUrl) {
      return undefined;
    }

    if (helpUrl.startsWith('http://') || helpUrl.startsWith('https://')) {
      return helpUrl;
    }

    if (this.baseUrl && helpUrl.startsWith('/')) {
      return `${this.baseUrl.replace(/\/$/, '')}${helpUrl}`;
    }

    return helpUrl;
  }

  formatMessage(key: string, placeholders: string[] = [], locale?: string): ValidationMessage | null {
    const messageData = this.getMessage(key, locale);

    if (!messageData) {
      return null;
    }

    const formattedMessage = this.replacePlaceholders(messageData.message, placeholders);
    const formattedDescription = messageData.description
      ? this.replacePlaceholders(messageData.description, placeholders)
      : undefined;

    const severity = this.getSeverityFromKey(key);

    return {
      key,
      severity,
      message: formattedMessage,
      description: formattedDescription,
      helpUrl: messageData.helpUrl,
      placeholders,
    };
  }

  private replacePlaceholders(template: string, placeholders: string[]): string {
    let result = template;

    result = result.replace(/\{\{(\d+)\}\}/g, (match, index) => {
      const placeholderIndex = parseInt(index, 10);
      return placeholders[placeholderIndex] || match;
    });

    if (placeholders.length > 0) {
      const placeholderNames = ['domain', 'accountId', 'sellerDomain', 'accountType'];
      placeholderNames.forEach((name, index) => {
        if (index < placeholders.length) {
          result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), placeholders[index]);
        }
      });
    }

    return result;
  }

  private getSeverityFromKey(key: string): Severity {
    const errorKeys = [
      'missingFields',
      'invalidFormat',
      'invalidRelationship',
      'invalidDomain',
      'emptyAccountId',
      'emptyFile',
      'invalidCharacters',
      'directAccountIdNotInSellersJson',
      'resellerAccountIdNotInSellersJson',
    ];

    if (errorKeys.includes(key)) {
      return Severity.ERROR;
    }

    const warningKeys = [
      'noSellersJson',
      'domainMismatch',
      'directNotPublisher',
      'resellerNotIntermediary',
      'sellerIdNotUnique',
    ];

    if (warningKeys.includes(key)) {
      return Severity.WARNING;
    }

    return Severity.INFO;
  }
}

let globalMessageProvider: MessageProvider = new DefaultMessageProvider();

export function setMessageProvider(provider: MessageProvider): void {
  globalMessageProvider = provider;
}

export function configureMessages(config: MessageConfig): void {
  globalMessageProvider = new DefaultMessageProvider(config.defaultLocale, config);
}

export function getMessageProvider(): MessageProvider {
  return globalMessageProvider;
}

export function createValidationMessage(
  key: string,
  placeholders: string[] = [],
  locale?: string,
): ValidationMessage | null {
  return globalMessageProvider.formatMessage(key, placeholders, locale);
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale in messages;
}

export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(messages) as SupportedLocale[];
}
