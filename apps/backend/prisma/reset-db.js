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
const RESTAURANT_ID = 'restaurant';
async function main() {
    console.log('--- Réinitialisation de la base de données ---');
    await prisma.orderItemsOnOrders.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.cashRegisterSession.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.order.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.menuItemOption.deleteMany();
    await prisma.menuItemOptionGroup.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.menuCategory.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.table.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.staffInvite.deleteMany();
    await prisma.userPermission.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.openingHours.deleteMany();
    await prisma.exceptionalClosure.deleteMany();
    await prisma.message.deleteMany();
    await prisma.report.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.deliveryZone.deleteMany();
    await prisma.restaurant.deleteMany();
    console.log('Base de données vidée.');
    const ownerPassword = process.env.SEED_OWNER_PASSWORD;
    const managerPassword = process.env.SEED_MANAGER_PASSWORD;
    if (!ownerPassword || !managerPassword) {
        throw new Error('SEED_OWNER_PASSWORD et SEED_MANAGER_PASSWORD sont requis pour exécuter reset-db.');
    }
    const restaurant = await prisma.restaurant.create({
        data: {
            id: RESTAURANT_ID,
            name: 'Restaurant Démo',
            slogan: 'Cuisine de saison, faite maison',
            currency: 'EUR',
            timezone: 'Europe/Paris',
            setupCompleted: true,
            setupCompletedAt: new Date(),
        },
    });
    await prisma.openingHours.createMany({
        data: Object.values(client_1.DayOfWeek).map((day) => ({
            dayOfWeek: day,
            openTime: '12:00',
            closeTime: '22:00',
            isClosed: day === client_1.DayOfWeek.MONDAY,
        })),
    });
    const owner = await prisma.user.create({
        data: {
            email: 'owner@flashmenu.com',
            password: await bcrypt.hash(ownerPassword, 12),
            name: 'Propriétaire',
            role: 'owner',
            emailVerified: true,
        },
    });
    const manager = await prisma.user.create({
        data: {
            email: 'manager@flashmenu.com',
            password: await bcrypt.hash(managerPassword, 12),
            name: 'Manager Démo',
            role: 'manager',
            emailVerified: true,
        },
    });
    console.log('--- Initialisation terminée ---');
    console.log(`Restaurant   : ${restaurant.name}`);
    console.log(`Propriétaire : ${owner.email}   / [SEED_OWNER_PASSWORD]`);
    console.log(`Manager      : ${manager.email} / [SEED_MANAGER_PASSWORD]`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset-db.js.map