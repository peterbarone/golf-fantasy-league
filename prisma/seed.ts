import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.tournamentSkins.deleteMany({});
    await prisma.teamPoints.deleteMany({});
    await prisma.golferResult.deleteMany({});
    await prisma.tournamentLineup.deleteMany({});
    await prisma.teamRoster.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.golfer.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@golffantasy.com',
        password: adminPassword,
        role: UserRole.ADMIN,
      },
    });

    console.log(`✅ Created admin user: ${admin.email}`);

    // Create 7 owner users
    const owners = [];
    const ownerPassword = await bcrypt.hash('owner123', 10);

    for (let i = 1; i <= 7; i++) {
      const owner = await prisma.user.create({
        data: {
          name: `Owner ${i}`,
          email: `owner${i}@golffantasy.com`,
          password: ownerPassword,
          role: UserRole.OWNER,
        },
      });
      owners.push(owner);
      console.log(`✅ Created owner user: ${owner.email}`);
    }

    // Create teams for each owner
    const teams = [];
    for (let i = 0; i < owners.length; i++) {
      const team = await prisma.team.create({
        data: {
          name: `Team ${i + 1}`,
          ownerId: owners[i].id,
        },
      });
      teams.push(team);
      console.log(`✅ Created team: ${team.name}`);
    }

    // Create golfers
    const golfers = [
      'Tiger Woods',
      'Rory McIlroy',
      'Jon Rahm',
      'Scottie Scheffler',
      'Brooks Koepka',
      'Dustin Johnson',
      'Justin Thomas',
      'Collin Morikawa',
      'Jordan Spieth',
      'Xander Schauffele',
      'Patrick Cantlay',
      'Bryson DeChambeau',
      'Hideki Matsuyama',
      'Shane Lowry',
      'Tony Finau',
      'Viktor Hovland',
      'Tommy Fleetwood',
      'Adam Scott',
      'Patrick Reed',
      'Webb Simpson',
      'Sergio Garcia',
      'Rickie Fowler',
      'Matt Fitzpatrick',
      'Louis Oosthuizen',
      'Bubba Watson',
      'Cameron Smith',
      'Abraham Ancer',
      'Jason Day',
      'Justin Rose',
      'Phil Mickelson',
      'Billy Horschel',
      'Paul Casey',
      'Joaquin Niemann',
      'Will Zalatoris',
      'Daniel Berger',
      'Max Homa',
      'Corey Conners',
      'Harris English',
      'Sungjae Im',
      'Marc Leishman',
      'Si Woo Kim',
      'Matthew Wolff',
      'Cameron Champ',
      'Ian Poulter',
      'Kevin Na',
      'Gary Woodland',
      'Kevin Kisner',
      'Matt Kuchar',
    ];

    const createdGolfers = [];
    for (const name of golfers) {
      const golfer = await prisma.golfer.create({
        data: {
          name,
          pgaId: `PGA-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          active: true,
        },
      });
      createdGolfers.push(golfer);
    }
    console.log(`✅ Created ${golfers.length} golfers`);

    // Assign 12 random golfers to each team
    for (const team of teams) {
      // Shuffle and pick 12 golfers
      const shuffled = [...createdGolfers].sort(() => 0.5 - Math.random());
      const selectedGolfers = shuffled.slice(0, 12);
      
      for (const golfer of selectedGolfers) {
        await prisma.teamRoster.create({
          data: {
            teamId: team.id,
            golferId: golfer.id,
          },
        });
      }
      console.log(`✅ Assigned 12 golfers to ${team.name}`);
    }

    // Create tournaments
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(now.getDate() + 14);

    const fourWeeksFromNow = new Date(now);
    fourWeeksFromNow.setDate(now.getDate() + 28);

    const tournaments = [
      {
        name: 'The Masters',
        startDate: twoWeeksFromNow,
        endDate: new Date(twoWeeksFromNow.getTime() + 3 * 24 * 60 * 60 * 1000),
        isMajor: true,
        isWGC: false,
        isMatchPlay: false,
        isActive: false,
      },
      {
        name: 'PGA Championship',
        startDate: fourWeeksFromNow,
        endDate: new Date(fourWeeksFromNow.getTime() + 3 * 24 * 60 * 60 * 1000),
        isMajor: true,
        isWGC: false,
        isMatchPlay: false,
        isActive: false,
      },
      {
        name: 'WGC-Dell Technologies Match Play',
        startDate: new Date(fourWeeksFromNow.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(fourWeeksFromNow.getTime() + 17 * 24 * 60 * 60 * 1000),
        isMajor: false,
        isWGC: true,
        isMatchPlay: true,
        isActive: false,
      },
    ];

    for (const tournamentData of tournaments) {
      const tournament = await prisma.tournament.create({
        data: tournamentData,
      });
      console.log(`✅ Created tournament: ${tournament.name}`);
      
      // Create skins entries for tournaments
      await prisma.tournamentSkins.create({
        data: {
          tournamentId: tournament.id,
          skinValue: 7 * 2, // $2 per team
          carryOver: false,
        },
      });
      console.log(`✅ Created skins entry for ${tournament.name}`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
