"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const password = process.env.SEED_OWNER_PASSWORD;
    if (!password)
        throw new Error('SEED_OWNER_PASSWORD manquant dans .env');
    const email = 'owner@flashmenu.com';
    const hashed = await bcrypt.hash(password, 12);
    const owner = await prisma.$transaction(async (tx) => {
        const created = await tx.user.upsert({
            where: { email },
            update: {
                password: hashed,
                emailVerified: true,
                role: 'owner',
                status: 'active',
            },
            create: {
                email,
                password: hashed,
                name: 'Propriétaire',
                firstName: 'Propriétaire',
                lastName: '',
                emailVerified: true,
                role: 'owner',
                status: 'active',
            },
        });
        await tx.user.updateMany({
            where: { role: 'owner', id: { not: created.id } },
            data: { role: 'manager' },
        });
        return created;
    });
    await prisma.refreshToken.deleteMany({ where: { userId: owner.id } });
    console.log('');
    console.log('✓ Compte propriétaire créé / mis à jour');
    console.log(`  Email    : ${email}`);
    console.log(`  Password : ${password}`);
    console.log(`  Rôle     : owner`);
    console.log('');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-owner.js.map