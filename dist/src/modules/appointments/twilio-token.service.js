"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = __importDefault(require("twilio"));
let TwilioTokenService = class TwilioTokenService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    createAppointmentToken(params) {
        const accountSid = this.configService.get("TWILIO_ACCOUNT_SID") ?? "AC00000000000000000000000000000000";
        const apiKey = this.configService.get("TWILIO_API_KEY") ?? "SK00000000000000000000000000000000";
        const apiSecret = this.configService.get("TWILIO_API_SECRET") ?? "twilio-dev-secret";
        const ttlSeconds = 3600;
        const roomName = `clink_${params.appointmentId}`;
        const token = new twilio_1.default.jwt.AccessToken(accountSid, apiKey, apiSecret, {
            identity: params.identity,
            ttl: ttlSeconds,
        });
        token.addGrant(new twilio_1.default.jwt.AccessToken.VideoGrant({ room: roomName }));
        return {
            accessToken: token.toJwt(),
            roomName,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        };
    }
};
exports.TwilioTokenService = TwilioTokenService;
exports.TwilioTokenService = TwilioTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TwilioTokenService);
//# sourceMappingURL=twilio-token.service.js.map