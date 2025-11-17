// SMS Request/Response Types

export interface SendSMSRequest {
  to: string; // phone number
  message: string; // SMS text
  patternId?: number; // optional pattern ID for template SMS
  patternParams?: Record<string, string>; // parameters for pattern SMS
}

export interface SendSMSResponse {
  success: boolean;
  message: string;
  messageId?: string; // MeliPayamak message ID
  statusCode?: number; // API status code
}

