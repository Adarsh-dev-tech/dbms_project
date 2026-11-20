import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { addDays, format } from 'date-fns';
import { MenuArray } from './model/menuModel';
import statesArray from './model/stateModel';

const prisma = new PrismaClient();

const sampleDistrictsByState: Record<string, string[]> = {
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
  Karnataka: ['Bengaluru Urban', 'Mysuru', 'Mangaluru'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  Telangana: ['Hyderabad', 'Warangal'],
  'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur'],
  'West Bengal': ['Kolkata', 'Howrah'],
  Rajasthan: ['Jaipur', 'Udaipur'],
  Kerala: ['Kochi', 'Thiruvananthapuram'],
  Punjab: ['Ludhiana', 'Amritsar'],
};

async function main() {
  console.log('Seeding local ExhibitionApp database...');

  // 1. Organization Types
  const orgTypes = ['Enterprise', 'SME', 'Startup', 'Exhibitor Agency'];
  const seededOrgTypes = [];
  for (let i = 0; i < orgTypes.length; i++) {
    const rec = await prisma.organizationTypeMaster.upsert({
      where: { id: i + 1 },
      update: { orgType: orgTypes[i] },
      create: {
        orgType: orgTypes[i],
        createdBy: 'System',
        status: true,
      },
    });
    seededOrgTypes.push(rec);
  }

  // 2. Default Demo Organization
  const org = await prisma.organizationMaster.upsert({
    where: { id: 1 },
    update: {
      orgName: 'Apex Exhibitions',
      orgDescription:
        'Demo exhibition management organization for trade shows and visitor lead tracking.',
      address: '100 Innovation Park, Pune',
      pincode: 411001,
      orgContactName: 'Admin User',
      orgMobileNo: '9876543210',
      orgEmail: 'admin@exhibition.local',
      orgTypeId: seededOrgTypes[0].id,
      status: true,
    },
    create: {
      orgName: 'Apex Exhibitions',
      orgDescription:
        'Demo exhibition management organization for trade shows and visitor lead tracking.',
      address: '100 Innovation Park, Pune',
      pincode: 411001,
      orgContactName: 'Admin User',
      orgMobileNo: '9876543210',
      orgEmail: 'admin@exhibition.local',
      orgTypeId: seededOrgTypes[0].id,
      createdBy: 'System',
      status: true,
    },
  });

  // 3. Menus
  for (const menu of MenuArray) {
    await prisma.menuMaster.upsert({
      where: { name: menu.name },
      update: {},
      create: { name: menu.name },
    });
  }

  // 4. Roles
  const adminRole = await prisma.roleMaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orgId: org.id,
      roleName: 'Admin',
      roleDescription: 'Full administrative access to campaigns, leads, products, and users',
      createdBy: 'System',
      status: true,
      menu: {
        create: MenuArray.map((m, idx) => ({
          menuId: idx + 1,
          menuName: m.name,
        })),
      },
    },
  });

  const staffRole = await prisma.roleMaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      orgId: org.id,
      roleName: 'Booth Staff',
      roleDescription: 'Captures visitor leads and manages booth gifts during exhibitions',
      createdBy: 'System',
      status: true,
      menu: {
        create: [
          { menuId: 1, menuName: 'Leads' },
          { menuId: 2, menuName: 'Campaign' },
          { menuId: 6, menuName: 'Gifts' },
        ],
      },
    },
  });

  // 5. Strategic Business Units (SBUs)
  const salesSbu = await prisma.sbuMaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orgId: org.id,
      sbuName: 'Sales & Outreach',
      sbuDescription: 'Enterprise exhibition sales team',
      createdBy: 'System',
      Status: true,
    },
  });

  const marketingSbu = await prisma.sbuMaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      orgId: org.id,
      sbuName: 'Product Marketing',
      sbuDescription: 'Product demos and brand campaigns',
      createdBy: 'System',
      Status: true,
    },
  });

  // 6. Demo Users (with bcrypt-hashed passwords)
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

  const adminUser = await prisma.userMaster.upsert({
    where: { email: 'admin@exhibition.local' },
    update: {
      password: adminPasswordHash,
      orgId: org.id,
      orgName: org.orgName,
      sbuId: salesSbu.id,
      roleId: adminRole.id,
      status: true,
    },
    create: {
      orgId: org.id,
      orgName: org.orgName,
      sbuId: salesSbu.id,
      username: 'Admin User',
      password: adminPasswordHash,
      email: 'admin@exhibition.local',
      mobile: '9876543210',
      address: '100 Innovation Park, Pune',
      pincode: 411001,
      roleId: adminRole.id,
      createdBy: 'System',
      status: true,
    },
  });

  await prisma.userMaster.upsert({
    where: { email: 'staff@exhibition.local' },
    update: {
      password: staffPasswordHash,
      orgId: org.id,
      orgName: org.orgName,
      sbuId: marketingSbu.id,
      roleId: staffRole.id,
      status: true,
    },
    create: {
      orgId: org.id,
      orgName: org.orgName,
      sbuId: marketingSbu.id,
      username: 'Priya Sharma',
      password: staffPasswordHash,
      email: 'staff@exhibition.local',
      mobile: '9822001122',
      address: 'Baner Road, Pune',
      pincode: 411045,
      roleId: staffRole.id,
      createdBy: 'System',
      status: true,
    },
  });

  // 7. Plans & Active Subscription
  const proPlan = await prisma.planMaster.upsert({
    where: { name: 'Pro Plan' },
    update: {},
    create: {
      name: 'Pro Plan',
      validity: '1 Year',
      validityInDays: 365,
      price: 9999,
      description: 'Unlimited campaigns, visitors, products, and team members',
      createdBy: 'System',
      status: true,
    },
  });

  await prisma.planMaster.upsert({
    where: { name: 'Trial Plan' },
    update: {},
    create: {
      name: 'Trial Plan',
      validity: '14 Days',
      validityInDays: 14,
      price: 0,
      description: '14-day evaluation plan for new organizations',
      createdBy: 'System',
      status: true,
    },
  });

  const existingSub = await prisma.subscriptionMaster.findFirst({
    where: { orgId: org.id, isActive: true },
  });
  if (!existingSub) {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), proPlan.validityInDays), 'yyyy-MM-dd');
    await prisma.subscriptionMaster.create({
      data: {
        orgId: org.id,
        userId: adminUser.id,
        planId: proPlan.id,
        startDate,
        endDate,
        transactionStatus: true,
        transactionReference: 'DEMO-PRO-SUB-001',
        noOfDaysPending: '365',
        isActive: true,
        status: true,
        createdBy: 'System',
      },
    });
  }

  // 8. App Versions (Web + Mobile)
  const versions = [
    { platform: 'WEB', latestVersion: '1.0' },
    { platform: 'ANDROID', latestVersion: '1.0' },
    { platform: 'IOS', latestVersion: '1.0' },
  ];
  for (const version of versions) {
    await prisma.versionMaster.upsert({
      where: { platform: version.platform },
      update: { latestVersion: version.latestVersion },
      create: version,
    });
  }

  // 9. States & Districts
  const stateMap = new Map<string, number>();
  for (const s of statesArray) {
    const state = await prisma.stateMaster.upsert({
      where: { name: s.state },
      update: {},
      create: { name: s.state },
    });
    stateMap.set(state.name, state.id);
  }

  const districtMap = new Map<string, number>();
  for (const [stateName, districts] of Object.entries(sampleDistrictsByState)) {
    const stateId = stateMap.get(stateName);
    if (!stateId) continue;
    for (const districtName of districts) {
      const dist = await prisma.districtMaster.upsert({
        where: { name: districtName },
        update: { stateId },
        create: { name: districtName, stateId },
      });
      districtMap.set(dist.name, dist.id);
    }
  }

  // 10. Campaign Types, Industry Types, Company Types
  const campaignTypes = [
    { name: 'Trade Show', desc: 'Large multi-industry trade exhibitions' },
    { name: 'Tech Expo', desc: 'Technology and software product showcases' },
    { name: 'Roadshow', desc: 'Regional city-by-city promotional events' },
    { name: 'Conference Booth', desc: 'Sponsored booths at industry conferences' },
  ];
  const seededCampaignTypes = [];
  for (let i = 0; i < campaignTypes.length; i++) {
    const ct = await prisma.campaignTypeMaster.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        camapignType: campaignTypes[i].name,
        campaignTypeDescription: campaignTypes[i].desc,
        createdBy: 'System',
        status: true,
      },
    });
    seededCampaignTypes.push(ct);
  }

  const industryTypes = [
    { name: 'Manufacturing', desc: 'Industrial equipment and manufacturing' },
    { name: 'Information Technology', desc: 'Software, cloud, and IT services' },
    { name: 'Healthcare & MedTech', desc: 'Medical devices and healthcare systems' },
    { name: 'Renewable Energy', desc: 'Solar, wind, and clean energy solutions' },
    { name: 'Automotive', desc: 'EVs, components, and mobility' },
  ];
  const seededIndustries = [];
  for (let i = 0; i < industryTypes.length; i++) {
    const ind = await prisma.industryTypeMaster.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        industryType: industryTypes[i].name,
        industryTypeDescription: industryTypes[i].desc,
        createdBy: 'System',
        status: true,
      },
    });
    seededIndustries.push(ind);
  }

  const companyTypes = [
    { name: 'Private Limited', desc: 'Privately held corporate entity' },
    { name: 'Public Enterprise', desc: 'Publicly listed organization' },
    { name: 'MSME / Startup', desc: 'Small or emerging business' },
    { name: 'Distributor / Dealer', desc: 'Channel partner or reseller' },
  ];
  const seededCompanyTypes = [];
  for (let i = 0; i < companyTypes.length; i++) {
    const ct = await prisma.companyTypeMaster.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        companyType: companyTypes[i].name,
        companyTypeDescription: companyTypes[i].desc,
        createdBy: 'System',
        status: true,
      },
    });
    seededCompanyTypes.push(ct);
  }

  // 11. Product Families & Products
  const family1 = await prisma.productFamilyMaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orgId: org.id,
      sbuId: salesSbu.id,
      productFamilyName: 'Smart Automation',
      productFamilyDescription: 'Industrial IoT controllers and robotic arms',
      createdBy: 'System',
      status: true,
    },
  });

  const family2 = await prisma.productFamilyMaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      orgId: org.id,
      sbuId: marketingSbu.id,
      productFamilyName: 'Power & Energy',
      productFamilyDescription: 'Solar inverters and battery storage systems',
      createdBy: 'System',
      status: true,
    },
  });

  const prod1 = await prisma.productMaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orgId: org.id,
      sbuId: salesSbu.id,
      productFamilyId: family1.id,
      productCode: 'AUTO-500',
      productName: 'FlexBot CNC Controller',
      productDescription: 'High-precision 6-axis automation controller',
      createdBy: 'System',
      status: true,
      model: {
        create: [{ modelName: 'FB-500 Standard' }, { modelName: 'FB-500 Pro' }],
      },
    },
  });

  const prod2 = await prisma.productMaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      orgId: org.id,
      sbuId: marketingSbu.id,
      productFamilyId: family2.id,
      productCode: 'SOL-20K',
      productName: 'HelioGrid 20kW Inverter',
      productDescription: 'Commercial three-phase hybrid solar inverter',
      createdBy: 'System',
      status: true,
      model: {
        create: [{ modelName: 'HG-20K Hybrid' }],
      },
    },
  });

  // 12. Sample Exhibition Campaigns
  const mhStateId = stateMap.get('Maharashtra') ?? 1;
  const kaStateId = stateMap.get('Karnataka') ?? 1;
  const puneDistId = districtMap.get('Pune') ?? 1;
  const blrDistId = districtMap.get('Bengaluru Urban') ?? 1;

  const campaign1 = await prisma.campaignMaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      orgId: org.id,
      campaignName: 'India Industrial Expo 2026',
      campaignTypeId: seededCampaignTypes[0].id,
      description: 'Annual manufacturing and automation showcase at Pune Exhibition Centre.',
      fromDate: '2026-11-25',
      toDate: '2026-11-29',
      stateId: mhStateId,
      districtId: puneDistId,
      location: 'Hall B, Stall 42, Pune',
      campaignObjective: 'Capture 150+ qualified manufacturing leads',
      createdBy: 'Admin User',
      status: true,
    },
  });

  const campaign2 = await prisma.campaignMaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      orgId: org.id,
      campaignName: 'Bengaluru GreenTech Summit',
      campaignTypeId: seededCampaignTypes[1].id,
      description: 'Clean energy and smart grid technology summit.',
      fromDate: '2026-12-10',
      toDate: '2026-12-12',
      stateId: kaStateId,
      districtId: blrDistId,
      location: 'BIEC Pavilion 2, Bengaluru',
      campaignObjective: 'Launch HelioGrid 20kW inverter and sign regional distributors',
      createdBy: 'Admin User',
      status: true,
    },
  });

  // 13. Sample Visitors / Leads (only seed if table is empty)
  const visitorCount = await prisma.visitorMaster.count();
  if (visitorCount === 0) {
    await prisma.visitorMaster.create({
      data: {
        orgId: org.id,
        sbuId: salesSbu.id,
        campaignId: campaign1.id,
        industryTypeId: seededIndustries[0].id,
        userId: adminUser.id,
        companyType: seededCompanyTypes[0].id,
        companyName: 'Orion Precision Engineering Pvt Ltd',
        address: 'MIDC Chakan, Pune',
        stateId: mhStateId,
        districtId: puneDistId,
        pincode: 410501,
        planningTimeline: '1-3 Months',
        financingReuired: true,
        noOfPeopleAccompanied: 2,
        noOfGifts: '1',
        giftDetails: 'Branded Desk Kit',
        createdBy: 'Admin User',
        status: true,
        visitorDetails: {
          create: [
            {
              orgId: org.id,
              sbuId: salesSbu.id,
              userId: adminUser.id,
              visitorName: 'Rohan Kulkarni',
              email: 'rohan@orionprecision.example',
              mobileNo: '9823112233',
            },
          ],
        },
        productsInterested: {
          create: [
            {
              orgId: org.id,
              sbuId: salesSbu.id,
              userId: adminUser.id,
              productFamilyId: family1.id,
              productId: prod1.id,
              noOfMachines: 3,
            },
          ],
        },
      },
    });

    await prisma.visitorMaster.create({
      data: {
        orgId: org.id,
        sbuId: marketingSbu.id,
        campaignId: campaign2.id,
        industryTypeId: seededIndustries[3].id,
        userId: adminUser.id,
        companyType: seededCompanyTypes[2].id,
        companyName: 'SunSpark Renewables',
        address: 'Whitefield, Bengaluru',
        stateId: kaStateId,
        districtId: blrDistId,
        pincode: 560066,
        planningTimeline: 'Immediate',
        financingReuired: false,
        noOfPeopleAccompanied: 1,
        noOfGifts: '1',
        giftDetails: 'Eco Water Bottle',
        createdBy: 'Priya Sharma',
        status: true,
        visitorDetails: {
          create: [
            {
              orgId: org.id,
              sbuId: marketingSbu.id,
              userId: adminUser.id,
              visitorName: 'Ananya Nair',
              email: 'ananya@sunspark.example',
              mobileNo: '9845009988',
            },
          ],
        },
        productsInterested: {
          create: [
            {
              orgId: org.id,
              sbuId: marketingSbu.id,
              userId: adminUser.id,
              productFamilyId: family2.id,
              productId: prod2.id,
              noOfMachines: 5,
            },
          ],
        },
      },
    });
  }

  console.log('Database seeding completed successfully!');
  console.log('Demo Login -> admin@exhibition.local / Admin@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
