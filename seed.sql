-- ==============================================================================
-- BOARDPASS: Idempotent Seed Data (seed.sql)
-- 20 Scenarios, 20 Drug Calcs, 30 Ward Tips, 5 Hospital Facilities
-- Real Kenyan Clinical Context, NCK Protocol Standard
-- ==============================================================================

-- 1. FACILITIES (5 Benchmark Kenyan Facilities)
INSERT INTO facilities (id, name, level, county, wards, notes, verified)
VALUES
  ('fac-00000000-0000-0000-0000-000000000001', 'Kenyatta National Hospital (KNH)', '6', 'Nairobi', ARRAY['ICU', 'Renal', 'Pediatrics 3B', 'Labour Ward', 'Burns Unit', 'Casualty'], 'Premier apex national referral and teaching hospital with high-acuity panel interviews.', true),
  ('fac-00000000-0000-0000-0000-000000000002', 'Moi Teaching & Referral Hospital (MTRH)', '6', 'Uasin Gishu', ARRAY['Riley Mother & Baby', 'Shoe4Africa Children', 'Surgical Ward 5', 'ICU'], 'Western Kenya apex referral centre. Emphasizes evidence-based protocols and clinical audits.', true),
  ('fac-00000000-0000-0000-0000-000000000003', 'Coast General Teaching & Referral Hospital', '5', 'Mombasa', ARRAY['Maternity Complex', 'ICU', 'Female Medical', 'Trauma Centre'], 'High-volume coastal referral hub with prominent tropical medicine, sickle cell, and eclampsia cases.', true),
  ('fac-00000000-0000-0000-0000-000000000004', 'The Aga Khan University Hospital, Nairobi', 'private', 'Nairobi', ARRAY['CCU', 'NICU', 'Oncology Day Care', 'Surgical Short Stay'], 'JCI-accredited tertiary private hospital prioritizing strict infection control, telemetry, and nurse advocacy.', true),
  ('fac-00000000-0000-0000-0000-000000000005', 'AIC Kijabe Hospital', 'faith', 'Kiambu', ARRAY['Bethany Kids PICU', 'Maternity', 'Male Surgical', 'Emergency'], 'Leading faith-based surgical and pediatric center known for meticulous perioperative care and compassion.'
)
ON CONFLICT (id) DO NOTHING;

-- 2. SCENARIOS (20 Comprehensive Kenyan Clinical Interview Scenarios)
INSERT INTO scenarios (
  slug, title, swahili_title, facility_level, department, trap_type, experience_level,
  scenario_text, swahili_scenario_text, what_board_tests,
  wrong_answer, swahili_wrong_answer,
  right_answer, swahili_right_answer,
  memory_stickiness, verified_by, version
)
VALUES
(
  'post-thyroidectomy-stridor-chvostek',
  'Post-Thyroidectomy Respiratory Distress & Stridor',
  'Kukosa Pumzi Baada ya Upasuaji wa Tezi ya Koo',
  '5', 'Surgical', 'Order of Operations', 'bsc',
  'You are on night duty in Surgical Ward 4 at a County Referral Hospital. A 34-year-old female post-subtotal thyroidectomy (6 hours post-op) rings the call bell. She is tachypneic (RR 32), anxious, with audible harsh inspiratory stridor, neck swelling with tight dressing, and reported tingling in her fingertips. Her pulse is 122 bpm, BP 148/92, SpO2 88% on room air.',
  'Uko zamu ya usiku katika Wodi ya Upasuaji ya Hospitali ya Rufaa ya Kaunti. Mgonjwa wa miaka 34 aliyefanyiwa upasuaji wa tezi ya koo (saa 6 zilizopita) anapiga kengele ya dharura. Anapumua kwa shida sana (RR 32), ana wasiwasi, sauti kali ya mluzi akivuta pumzi (stridor), uvimbe kwenye shingo na bendeji imebana, na anaripoti mwasho/kufa ganzi kwenye vidole. Mapigo ya moyo ni 122, BP 148/92, hewa ya oksijeni ni 88%.',
  'NCK board panels evaluate immediate recognition of life-threatening wound hematoma compressing trachea vs hypocalcemia from parathyroid damage. The trap tests whether the candidate wastes time waiting for surgical review or IV calcium before relieving acute airway tension.',
  'Reassure patient, administer 10% Calcium Gluconate IV slowly over 10 minutes for suspected tetany, apply high-flow oxygen mask, and phone the surgical resident on call to come review dressing.',
  'Mtulize mgonjwa, mpe Calcium Gluconate ya 10% polepole kwa dakika 10 ukidhani ni tetany, mwekee oksijeni, kisha upigie simu daktari mpasuaji anayeshika zamu aje akague bendeji.',
  'Call for rapid emergency bedside assistance immediately. Immediately cut the sutures and open the surgical wound dressing at the bedside to release the expanding hematoma compressing the airway, maintain airway patency, administer high-flow oxygen, prepare tracheostomy tray, and simultaneously summon surgical team.',
  'Piga kelele ya dharura mara moja uombe msaada. Kata mishono mara moja kitandani na ufungue bendeji ili kutoa damu iliyoganda (hematoma) inayoziba mkondo wa hewa, weka oksijeni ya kiwango cha juu, andaa trei ya tracheostomy, huku ukimwita daktari mpasuaji kwa haraka sana.',
  94, 'Senior Nurse Specialist, KNH Surgical ICU', 1
),
(
  'eclamptic-seizure-maternity-triage',
  'Eclamptic Seizure in Antenatal Ward Triage',
  'Degedege la Mama Mjamzito Katika Wodi ya Wazazi',
  '4', 'Maternity', 'Drug Choice & Priority', 'experienced',
  'A 19-year-old primigravida at 37 weeks gestation arrives in maternity admissions with severe headache, epigastric pain, and blurry vision. While on the admission couch, she suddenly develops generalized tonic-clonic convulsions. Her husband attempts to insert a wooden spoon into her mouth.',
  'Binti wa miaka 19 mjamzito wa kwanza (wiki 37) anafika wodi ya wazazi akiwa na maumivu makali ya kichwa, tumbo la juu na macho kuona ukungu. Akiwa kitandani mara moja anaanza degedege kali la mwili mzima. Mumewe anajaribu kuweka kijiko cha mti mdomoni mwake.',
  'Testing safety priority during active seizure, airway protection without forced oral devices, followed by loading dose of Magnesium Sulfate (Pritchard regimen: 4g IV + 10g IM) over Diazepam.',
  'Force open mouth to insert bite block or tongue depressor to protect tongue, give 10mg Diazepam IV stat to break seizure, then check fetal heart rate.',
  'Mlazimishe kufungua mdomo uweke kifaa cha kuzuia ulimi, mpe Diazepam 10mg IV mara moja kusimamisha degedege, kisha pima mapigo ya mtoto.',
  'Protect patient from physical trauma without forceful restraint; position patient in left lateral tilt to prevent aspiration and relieve vena cava compression; clear airway and administer oxygen via face mask. Do NOT insert anything into mouth. Administer Magnesium Sulfate loading dose (4g IV in 20% solution over 10-15 mins + 10g IM 50% solution into each buttock with lignocaine) and monitor vitals, patellar reflexes, respiratory rate, and urine output.',
  'Kinga mgonjwa asijigonge bila kumzuia kwa nguvu; mlaze upande wa kushoto (left lateral) kuzuia matapishi kuingia kwenye mapafu; safisha mkondo wa hewa na umpe oksijeni. USIWEKE chochote mdomoni. Toa dozi kamili ya Magnesium Sulfate (4g IV polepole na 10g IM kwenye makalio) na ufuatilie reflex ya magoti, upumuaji na mkojo.',
  98, 'Provincial Maternity Nurse Manager', 1
),
(
  'pediatric-severe-dehydration-shock',
  'Severe Dehydration & Hypovolemic Shock in Infant',
  'Upungufu Mkubwa wa Maji Mwilini kwa Mtoto Mchanga',
  '3', 'Pediatrics', 'Fluid Calculation', '1yr',
  'An 8-month-old infant weighing 8kg is brought to the health centre with 2 days of profuse watery diarrhea and vomiting. Physical exam shows sunken fontanelle, lethargy, skin pinch going back very slowly (>2 seconds), and impalpable radial pulses with capillary refill of 4 seconds.',
  'Mtoto wa miezi 8 mwenye kilo 8 analetwa kwenye kituo cha afya akiwa na kuhara na kutapika maji kwa siku mbili. Utotoni fontanelle imedidimia, mtoto hana nguvu, ngozi ikivutwa inarudi polepole sana (> sekunde 2), na mapigo ya mshipa hayasikiki vizuri na refill ya kapilari ni sekunde 4.',
  'Testing IMCI / WHO Plan C fluid resuscitation protocol: 100ml/kg Ringer Lactate given rapidly with specific time breakdown for infants (<12 months: 30ml/kg in 1 hr, then 70ml/kg in 5 hrs).',
  'Encourage the mother to immediately breastfeed and give 100ml ORS through a nasogastric tube; start Maintenance Dextrose 5% at 40 drops per minute.',
  'Mhimize mama amnyonyeshe na mpe 100ml ORS kwa mpira wa puani; kisha anza matone ya Dextrose 5% kwa matone 40 kwa dakika.',
  'Start IV Ringer Lactate (or Normal Saline) immediately under Plan C: Total 100 ml/kg = 800 ml. For infant <12 months, give 30 ml/kg (240 ml) in the first 1 hour, reassessing every 15 minutes. Then give remaining 70 ml/kg (560 ml) over 5 hours. Continue monitoring hydration signs and prepare zinc supplementation once vomiting ceases.',
  'Anzisha dripu ya Ringer Lactate (au Normal Saline) haraka kulingana na Mpango C wa IMCI: Jumla 100 ml/kg = 800 ml. Kwa mtoto chini ya mwaka 1, toa 30 ml/kg (240 ml) katika saa ya kwanza, ukipima kila dakika 15. Kisha malizia 70 ml/kg (560 ml) kwa saa 5 zinazofuata. Fuatilia kwa karibu na mpe zinki pindi kutapika kunapokoma.',
  92, 'Pediatric Clinical Instructor, KMTC', 1
),
(
  'post-op-epidural-hypotension-motor-block',
  'Post-Cesarean Epidural Hypotension & High Block',
  'Kushuka kwa Shinikizo la Damu Baada ya Ganzi ya Mgongo',
  '4', 'Maternity', 'Assessment Priority', 'experienced',
  'A 28-year-old mother 45 minutes post-elective spinal/epidural cesarean section in PACU reports feeling dizzy, nauseated, and unable to breathe properly. Her BP dropped from 120/75 to 78/42 mmHg, HR is 54 bpm, and she cannot lift her hands above her chest.',
  'Mama wa miaka 28 akiwa chumba cha kuamkia baada ya upasuaji wa kujifungua kwa ganzi ya uti wa mgongo anasema ana kisunzi, kichefuchefu, na hawezi kupumua vizuri. BP imeshuka kutoka 120/75 hadi 78/42 mmHg, mapigo ya moyo 54, na hawezi kuinua mikono kifuani.',
  'Recognizing high spinal block with sympathectomy causing profound bradycardia, hypotension, and respiratory compromise.',
  'Administer Metoclopramide 10mg IV for nausea, raise head of bed to 45 degrees to help her breathe, and wait 15 minutes to recheck blood pressure.',
  'Mpe Metoclopramide 10mg IV kwa kichefuchefu, inua kichwa cha kitanda nyuzi 45 ili apumue vizuri, na usubiri dakika 15 kupima tena shinikizo.',
  'Immediately call for anesthetist help, place patient in left lateral tilt or displace uterus to left, lower head of bed if safe or maintain supine with leg elevation (Trendelenburg/passive leg raise), deliver 100% oxygen via non-rebreather mask, open IV fluid bolus (Ringer Lactate 500-1000ml rapid wide open), and prepare IV Atropine and Ephedrine/Phenylephrine as ordered.',
  'Mpigie simu daktari wa usingizi/ganzi mara moja, mlaze mgonjwa kuelekea kushoto au sukuma mji wa mimba kushoto, inua miguu juu (passive leg raise), fungulia dripu ya Ringer Lactate iingie kwa kasi, weka oksijeni kamili ya 100%, na uandae sindano za Atropine na Ephedrine kulingana na maagizo.',
  89, 'PACU In-Charge, Coast General Hospital', 1
),
(
  'anaphylactic-reaction-ceftriaxone',
  'Acute Anaphylaxis Following IV Ceftriaxone',
  'Mshituko Mkali wa Mzio Baada ya Sindano ya Ceftriaxone',
  '4', 'Medical', 'Drug Choice & Priority', 'no-exp',
  'A 24-year-old male with severe pneumonia receives an initial test dose of IV Ceftriaxone. Within 2 minutes, he develops facial angioedema, generalized urticaria, severe wheezing, stridor, and falls to the floor with BP 70/40 mmHg.',
  'Mwanaume wa miaka 24 mwenye nimonia kali anachomwa dozi ya kwanza ya Ceftriaxone kwenye mshipa. Ndani ya dakika 2 uso unavimba, anatokwa vipele mwilini, anakosa pumzi kwa miluzi, na anaanguka sakafuni na BP ya 70/40.',
  'Confirming intramuscular Adrenaline (1:1000) 0.5mg in anterolateral thigh as the undisputed first-line drug of choice, NOT IV Hydrocortisone or Chlorpheniramine.',
  'Inject Hydrocortisone 200mg IV stat followed by Chlorpheniramine 10mg IV, then apply oxygen.',
  'Mchome Hydrocortisone 200mg IV mara moja ikifuatiwa na Chlorpheniramine 10mg IV, kisha umwekee oksijeni.',
  'Immediately stop the offending drug infusion. Administer Adrenaline 1:1000 (0.5mg = 0.5ml) Intramuscularly into the anterolateral mid-thigh immediately without delay. Call for resuscitation help, lay patient flat with legs elevated, administer high-flow oxygen, establish large-bore IV access for fluid resuscitation, and administer secondary medications (Hydrocortisone & Chlorpheniramine) only AFTER adrenaline.',
  'Simamisha mara moja dawa inayoingia. Mchome sindano ya Adrenaline 1:1000 (0.5mg = 0.5ml) kwenye misuli ya paja la pembeni (mid-anterolateral thigh) bila kuchelewa hata sekunde. Omba msaada wa resuscitation, mlaze chini miguu ikiwa juu, weka oksijeni ya juu, fungua dripu ya maji, na upe Hydrocortisone au Piriton BAADA ya Adrenaline.',
  96, 'Casualty Nurse Lead, MTRH', 1
),
(
  'acute-asthma-attack-salbutamol-oxygen',
  'Severe Acute Asthma Exacerbation in Casualty',
  'Shambulio Kali la Pumu Katika Idara ya Ajali na Dharura',
  '4', 'Casualty', 'Order of Operations', 'bsc',
  'A 17-year-old student is rushed to Emergency unable to complete full sentences in one breath. She is sitting forward (tripod position), pulse 134 bpm, RR 36, SpO2 86%, and PEFR is 35% of predicted. Auscultation reveals a quiet chest with barely audible air entry.',
  'Mwanafunzi wa miaka 17 analetwa chumba cha dharura akiwa hawezi kumaliza sentensi bila kukata pumzi. Ameinama mbele kifuani, mapigo 134, RR 36, hewa ya oksijeni 86%. Kwenye stetoskopu kifua kimenyamaza kabisa bila hewa kuingia vizuri (silent chest).',
  'Recognizing silent chest as impending respiratory arrest; providing nebulized short-acting beta2-agonist with oxygen driving gas and systemic corticosteroids.',
  'Give oral Prednisolone 40mg and instruct patient to perform incentive spirometry every 15 minutes.',
  'Mpe vidonge vya Prednisolone 40mg na umwambie afanye mazoezi ya spirometry kila dakika 15.',
  'Recognize silent chest as life-threatening. Immediately administer high-flow oxygen via nebulizer driven with 6-8 L/min O2 containing Salbutamol 5mg + Ipratropium Bromide 0.5mg. Administer IV Hydrocortisone 200mg (or oral Prednisolone 40-50mg). Prepare IV Magnesium Sulfate 2g infusion over 20 minutes if no rapid response, and alert ICU/anesthetist.',
  'Tambua silent chest kama dalili hatari ya kifo. Toa mara moja nebulization ya Salbutamol 5mg pamoja na Ipratropium 0.5mg ikiendeshwa na oksijeni ya lita 6-8 kwa dakika. Mpe Hydrocortisone 200mg IV au Prednisolone vidonge. Andaa Magnesium Sulfate 2g IV ikiwa haonyeshi nafuu na ujulishe ICU mapema.',
  91, 'Lead Emergency Nurse, KNH', 1
),
(
  'postpartum-hemorrhage-uterine-atony',
  'Postpartum Hemorrhage (PPH) Secondary to Uterine Atony',
  'Kutokwa Damu Nyingi Baada ya Kujifungua Kutokana na Mji wa Mimba Kulegea',
  '3', 'Maternity', 'Order of Operations', '1yr',
  'Ten minutes after spontaneous vaginal delivery of a 4.2kg baby, you notice a massive gush of fresh blood from the introitus (>700ml). Palpation of the abdomen reveals a soft, boggy, relaxed uterus palpable above the umbilicus.',
  'Dakika kumi baada ya kujifungua mtoto wa kilo 4.2 njia ya kawaida, unaona damu nyingi sana inamwagika (>700ml). Ukipapasa tumbo unakuta mfuko wa uzazi umelainika na kulegea (boggy) juu ya kitovu.',
  'Active management of 3rd stage and PPH protocol: Bimanual uterine compression and uterine massage, Oxytocin and secondary uterotonics (Misoprostol / Tranexamic Acid), bladder evacuation, and resuscitation.',
  'Pack the vagina tightly with sterile cotton wool and wait for the doctor to arrive for manual vacuum aspiration.',
  'Ziba uke kwa pamba safi umsubiri daktari aje kufanya vacuum aspiration.',
  'Call for assistance immediately ("Help! PPH in Room 2!"). Perform vigorous continuous fundal and bimanual uterine compression. Administer Oxytocin 10-20 IU in 500ml Normal Saline IV rapid infusion, insert indwelling Foley catheter to empty the full bladder, administer Misoprostol 800mcg rectally and Tranexamic Acid 1g IV over 10 minutes, and establish two large-bore IV cannulae (16G) for warm fluid resuscitation.',
  'Piga kelele ya kuomba msaada mara moja ("Msaada! Damu inamwagika chumba nambari 2!"). Fanya massage ya tumbo na bimanual compression kushikilia na kufinya mji wa uzazi. Weka Oxytocin 20 IU kwenye 500ml Normal Saline kwa kasi, weka catheter kutoa mkojo kibofu kisizue mji kufunga, weka Misoprostol 800mcg puruni na Tranexamic Acid 1g IV, na ufungue mishipa miwili mikubwa ya 16G kwa maji moto.',
  99, 'Midwife Specialist, Pumwani Maternity Hospital', 1
),
(
  'diabetic-ketoacidosis-hypokalemia-trap',
  'Diabetic Ketoacidosis (DKA) & Hypokalemia Pitfall',
  'Kisukari Hatari cha DKA na Mtego wa Upungufu wa Potassium',
  '5', 'Medical', 'Trap / Safety', 'bsc',
  'A 21-year-old with Type 1 Diabetes presents with Kussmaul respirations, fruity breath, blood glucose 29.4 mmol/L, arterial pH 7.15, urine ketones 4+. The initial lab panel shows Serum Potassium is 3.1 mmol/L.',
  'Kijana wa miaka 21 mwenye Kisukari cha Aina ya Kwanza anafika akipumua kwa nguvu sana (Kussmaul breathing), pumzi inatoa harufu ya matunda, sukari ya damu 29.4 mmol/L, na pH ya damu 7.15, mkojo una ketones 4+. Matokeo ya maabara yanaonyesha Potassium ni 3.1 mmol/L.',
  'Board testing knowledge that insulin drives potassium into cells, potentially precipitating fatal cardiac arrest if insulin is started while potassium is below 3.3 mmol/L.',
  'Immediately start an IV insulin infusion at 0.1 units/kg/hour to clear the dangerous ketoacidosis before addressing electrolytes.',
  'Anzisha dripu ya insulini ya 0.1 units/kg/saa mara moja ili kupunguza ketoacidosis hatari kabla ya kurekebisha chumvi mwilini.',
  'DO NOT start insulin immediately when potassium is < 3.3 mmol/L. First commence IV fluid resuscitation with Normal Saline 0.9% and add Potassium Chloride (20-30 mEq/L) to the IV fluids. Only initiate regular insulin infusion once serum potassium is corrected above 3.3 mmol/L to prevent fatal cardiac arrhythmias and respiratory arrest.',
  'USIANZISHE insulini mara moja ikiwa kiwango cha Potassium kiko chini ya 3.3 mmol/L. Anza dripu ya Normal Saline na uweke Potassium Chloride (20-30 mEq/L) kwanza. Anzisha insulini pale tu Potassium inapovuka 3.3 mmol/L ili kuepuka mshtuko hatari wa moyo na kifo cha ghafla.',
  97, 'Consultant Clinical Nurse Specialist, KNH', 1
),
(
  'post-op-compartment-syndrome-tibia-cast',
  'Acute Compartment Syndrome Following Tibial Plaster Cast',
  'Shinikizo Kali la Misuli Baada ya Kufungwa POP ya Mguu',
  '5', 'Surgical', 'Assessment Priority', 'experienced',
  'A 29-year-old male motorcycle crash survivor has a full leg POP cast applied for closed tibial fracture 8 hours ago. He complains of excruciating, burning calf pain unresponsive to 10mg IV Morphine. On inspection, his toes are swollen and cool, and pain is dramatically aggravated by passive extension of the great toe.',
  'Kijana wa miaka 29 aliyepata ajali ya bodaboda amefungwa POP mguu mzima kutokana na kuvunjika mfupa wa tibia saa 8 zilizopita. Analalamika maumivu makali mno ya ndama yanayochoma ambayo hayajapoa hata baada ya kuchomwa Morphine 10mg IV. Vidole vimevimba na ni vya baridi, na maumivu yanaongezeka vikali unapoegemeza kidole gumba juu.',
  'Recognizing the 6 Ps and specifically pain out of proportion to injury aggravated by passive stretch as the hallmark of compartment syndrome, requiring immediate cast bivalving.',
  'Administer an extra 5mg IV Morphine, elevate the casted leg above heart level on 3 pillows to reduce edema, and wait for morning ward rounds.',
  'Mwongezee Morphine 5mg IV, inua mguu juu ya moyo kwa mito mitatu ili kupunguza uvimbe, na usubiri daktari asubuhi.',
  'Recognize acute compartment syndrome surgical emergency. Immediately split/bivalve the plaster cast and underlying padding completely along both medial and lateral sides down to skin to relieve compartment pressure. Keep leg at heart level (NOT elevated above heart, as elevation reduces arterial perfusion). Notify orthopedic surgeon urgently for emergency fasciotomy.',
  'Tambua hii ni dharura ya upasuaji ya compartment syndrome. Pasua au fungua plasta ya POP (bivalve) mara moja pande zote mbili hadi kwenye ngozi ili kutoa shinikizo. Weka mguu usawa wa moyo (USIUINUE juu ya moyo kwani itapunguza damu ya mishipa). Mjulishe mpasuaji wa mifupa kwa ajili ya fasciotomy ya haraka.',
  95, 'Orthopedic Nurse Specialist, MTRH', 1
),
(
  'neonatal-resuscitation-golden-minute',
  'Neonatal Resuscitation in Labor Ward (The Golden Minute)',
  'Kuhuisha Mtoto Mchanga Aliyefifia Wakati wa Kuzaliwa',
  '3', 'Maternity', 'Order of Operations', 'student',
  'A full-term infant is delivered via spontaneous vertex delivery. Fluid is clear, but the neonate is limp, cyanotic, and apnoeic. The student nurse at the delivery table begins slapping the soles of the feet vigorously.',
  'Mtoto anazaliwa akiwa amekomaa vizuri. Maji yalikuwa masafi, lakini mtoto amelegea kabisa, ana rangi ya bluu na hapumui. Mwanafunzi wa uuguzi anaanza kupiga makofi chini ya nyayo za mtoto kwa nguvu.',
  'Testing Kenya MOH / Helping Babies Breathe (HBB) protocol: Dry thoroughly, clear secretions if obstructed, stimulate by rubbing back once, evaluate breathing. If still apnoeic within 60 seconds (Golden Minute), initiate positive pressure ventilation (PPV) with bag and mask at 40-60 breaths/min.',
  'Continue vigorous foot slapping and chest compressions while preparing IV adrenaline in an umbilical catheter.',
  'Endelea kumpiga nyayo na kuminya kifua huku ukiandaa Adrenaline ya mshipa wa kitovu.',
  'Stop slapping. Place newborn under radiant warmer, dry thoroughly while removing wet linen to prevent hypothermia, position head slightly extended (sniffing position), gently suction mouth then nose only if obstructed. If breathing remains absent or gasping by 60 seconds (The Golden Minute), start Positive Pressure Ventilation (PPV) immediately using newborn bag and correct size mask at 40-60 breaths per minute on room air (21% O2).',
  'Acha kupiga makofi. Mweke mtoto chini ya taa ya joto (radiant warmer), mkaushe haraka na uondoe vitambaa vyenye unyevunyevu, weka kichwa sawa (sniffing position), safisha mdomo kisha pua ikiwa pana uchafu. Ikiwa hapumui kabla ya sekunde 60 (Golden Minute), anza kumpulizia hewa kwa bag-valve-mask (PPV) kwa pumzi 40-60 kwa dakika ukitumia hewa ya kawaida.',
  97, 'Neonatal Nurse Trainer, Pumwani', 1
),
(
  'acute-blood-transfusion-reaction-hemolytic',
  'Acute Hemolytic Blood Transfusion Reaction',
  'Mwitikio Hatari wa Mwilini Wakati wa Kuongezewa Damu',
  '4', 'Medical', 'Order of Operations', '1yr',
  'Fifteen minutes after starting a unit of packed red blood cells for a severely anemic patient, the patient develops fever (38.9°C), rigors, severe flank and lower back pain, dyspnea, and red-colored urine in the catheter tubing.',
  'Dakika 15 baada ya kuanzisha chupa ya damu kwa mgonjwa mwenye upungufu mkubwa wa damu, anapata homa kali (38.9°C), anatetemeka kwa baridi, maumivu makali ya kiuno na mgongo, anashindwa kupumua, na mkojo kwenye catheter unakuwa mwekundu.',
  'Testing immediate cessation of transfusion, maintaining IV line with fresh normal saline, checking clerical labels, and sending blood pack and patient samples back to lab.',
  'Slow down the transfusion rate to 10 drops per minute, administer Paracetamol 1g and Piriton 10mg IV, and monitor for 30 minutes.',
  'Punguza kasi ya damu iende matone 10 kwa dakika, mpe Paracetamol 1g na Piriton 10mg, kisha umtazame kwa dakika 30.',
  'Immediately STOP the blood transfusion at once! Disconnect the blood administration set from the IV cannula. Flush and keep the IV line open with fresh Normal Saline using an entirely new infusion set. Monitor airway, breathing, circulation, oxygen saturation, and urine output. Check clerical labels at bedside against patient wristband. Notify doctor and blood transfusion laboratory immediately. Send the remaining blood bag, tubing, and fresh post-transfusion patient blood and urine samples to the lab for hemolytic investigation.',
  'SIMAMISHA kuingiza damu mara moja kabisa! Tenganisha mpira wa damu kutoka kwenye sindano ya mshipani. Weka mpira mpya wa dripu na ufungulie Normal Saline ili mshipa usizibe. Pima uhai na mkojo. Kagua lebo ya chupa na jina la mgonjwa. Mjulishe daktari na maabara ya benki ya damu mara moja. Peleka chupa ya damu iliyobaki pamoja na sampuli mpya za damu na mkojo wa mgonjwa maabarani kuchunguzwa.',
  98, 'Clinical Nurse Lead, Blood Transfusion Unit KNH', 1
),
(
  'hypertensive-urgency-pregnancy-labetalol',
  'Severe Hypertension in Pregnancy (Impending Eclampsia)',
  'Shinikizo la Juu Sana la Damu Wakati wa Ujauzito',
  '4', 'Maternity', 'Drug Choice & Priority', 'experienced',
  'A 32-year-old G3P2 at 34 weeks gestation attends clinic with BP 178/114 mmHg confirmed twice 15 minutes apart. Urinalysis shows proteinuria 3+. She reports frontal headache and hyperreflexia with 3 beats of ankle clonus.',
  'Mama mjamzito wa mimba ya tatu (wiki 34) anafika kliniki akiwa na BP ya 178/114 mmHg iliyothibitishwa mara mbili. Kipimo cha mkojo kina protini 3+. Analalamika kuumwa kichwa na misuli ikigongwa inaruka sana (clonus beats 3).',
  'Antihypertensive administration of first-line agents (IV Labetalol or oral Hydralazine/Nifedipine) combined with seizure prophylaxis (Magnesium Sulfate). ACE inhibitors and ARBs are strictly contraindicated.',
  'Prescribe Enalapril 10mg orally to protect maternal renal function and tell her to bed rest at home with weekly follow-up.',
  'Mwandikie vidonge vya Enalapril 10mg kulinda figo na umwambie akapumzike nyumbani na arudi baada ya wiki.',
  'Admit to high-dependency maternity unit immediately. Administer rapid-acting antihypertensive: IV Labetalol 20mg over 2 minutes (repeated doubling up to 80mg every 10 mins as protocol) OR oral Nifedipine 10mg. Simultaneously initiate Magnesium Sulfate loading dose as seizure prophylaxis against impending eclampsia. Target BP 135-145/80-90 mmHg (avoid precipitous drops). Monitor continuous fetal heart rate and maternal reflexes.',
  'Mlazishe kwenye wodi ya wazazi ya uangalizi maalum mara moja. Toa dawa ya haraka ya kushusha BP: Labetalol 20mg IV polepole au Nifedipine 10mg vidonge. Wakati huo huo anza Magnesium Sulfate kuzuia degedege la eclampsia. Lengo la BP ni 135-145/80-90. Fuatilia mapigo ya mtoto na uthabiti wa mama.',
  93, 'Midwife In-Charge, Machakos Level 5 Hospital', 1
),
(
  'post-op-atelectasis-vs-pulmonary-embolism',
  'Post-Op Shortness of Breath: Atelectasis vs PE',
  'Kukosa Pumzi Baada ya Upasuaji: Kuziba Mapafu au Damu Kuganda',
  '5', 'Surgical', 'Assessment Priority', 'bsc',
  'On postoperative day 3 following open cholecystectomy, a 48-year-old obese patient suddenly develops pleuritic right-sided chest pain, acute tachypnea (RR 34), tachycardia (HR 124 bpm), and SpO2 84%. Calf examination reveals swelling and tenderness in left calf.',
  'Siku ya tatu baada ya upasuaji wa kibofu cha nyongo, mgonjwa mwenye uzito mkubwa anashikwa na maumivu makali ya ghafla kifuani upande wa kulia, anapumua haraka sana (RR 34), mapigo 124, na oksijeni 84%. Ukikagua mguu unakuta ndama ya kushoto imevimba na inauma ukigusa.',
  'Differentiating pulmonary embolism from simple post-op atelectasis; recognizing deep vein thrombosis (DVT) signs and initiating emergency stabilization with oxygen and anticoagulation protocol.',
  'Instruct patient to cough and use deep breathing incentive spirometer for atelectasis and administer oral ibuprofen.',
  'Mwambie mgonjwa akohoe na kuvuta pumzi kwa nguvu akidhani mapafu yamebana kisha mpe dawa ya Ibuprofen.',
  'Recognize high probability of acute Pulmonary Embolism secondary to DVT. Apply high-flow oxygen via non-rebreather mask immediately, position patient in high-Fowlers position, perform urgent bedside 12-lead ECG and arterial blood gases, call the surgical and medical team urgently, and prepare for emergent therapeutic anticoagulation (Low Molecular Weight Heparin / Enoxaparin or Unfractionated Heparin) pending CT pulmonary angiography.',
  'Tambua hii ni hatari kubwa ya Pulmonary Embolism (DVT iliyopanda kwenye mapafu). Weka oksijeni ya kiwango cha juu mara moja, inua kitanda (high-Fowlers), fanya ECG ya haraka na vipimo vya damu, mwite daktari wa dharura mara moja, na uandae kuanza dawa za kuyeyusha damu (Enoxaparin / Heparin) kabla ya CT Scan.',
  92, 'Critical Care Specialist Nurse, KNH ICU', 1
),
(
  'tracheostomy-decannulation-emergency',
  'Accidental Tracheostomy Tube Decannulation',
  'Kutoka kwa Mpira wa Tracheostomy kwa Bahati Mbaya',
  '6', 'Surgical', 'Order of Operations', 'experienced',
  'In the ENT ward, a patient who underwent fresh surgical tracheostomy 3 days ago coughs violently, causing the tracheostomy tube to dislodge completely onto the floor. The patient is gasping for air, turning blue, and panicking.',
  'Katika wodi ya ENT, mgonjwa aliyefanyiwa tracheostomy siku 3 zilizopita anakohoa kwa nguvu na mpira wa kooni unachomoka na kuanguka sakafuni. Mgonjwa anakosa pumzi kabisa, anageuka rangi ya bluu na ameshikwa na hofu kuu.',
  'Fresh stoma (<7 days) has unformed tract; improper blind reinsertion can create a false lumen in pre-tracheal space causing total asphyxiation. Proper sequence uses tracheal dilator or obturator with spare tube or bag-valve-mask covering stoma/mouth.',
  'Pick up the dislodged tube from the floor, wipe it with surgical spirit, and push it firmly back into the neck opening.',
  'Okota ule mpira ulioanguka sakafuni, uifute kwa spirit, na uukandamize tena ndani ya lile shimo la shingo.',
  'Do NOT force a contaminated or blind tube into a fresh stoma. Call for emergency ENT/airway assistance immediately. Keep calm, extend the patient''s neck, use a sterile tracheal dilator to hold stoma open, and gently insert a sterile replacement tracheostomy tube (or smaller size 6.0 tube) with obturator lubricated. If replacement fails, immediately cover stoma with gloved finger and ventilate patient via mouth/nose with bag-valve-mask while awaiting surgical airway.',
  'USILAZIMISHE kuingiza mpira mchafu au bila kuona njia. Piga kengele ya dharura ya ENT/airway mara moja. Nyoosha shingo ya mgonjwa, tumia kifaa cha kufungua njia ya trachea (tracheal dilator) ili shimo lisizibe, kisha ingiza mpira mpya safi wa saizi ndogo kidogo uliopakwa mafuta. Ikiwa itashindikana, ziba shimo la shingoni na uanze kumpulizia hewa kupitia mdomoni na puani kwa bag-mask huku ukingojea wataalamu.',
  95, 'ENT Head Nurse, KNH', 1
),
(
  'burn-resuscitation-parkland-formula',
  'Major Burn Fluid Resuscitation (Parkland Formula)',
  'Kuhudumia Mgonjwa Aliyeungua Vibaya kwa Moto (Kipimo cha Parkland)',
  '5', 'Casualty', 'Fluid Calculation', 'bsc',
  'A 30-year-old male weighing 70kg is brought to casualty 2 hours after a domestic gas cylinder explosion. Examination shows second and third-degree burns covering his entire chest, anterior abdomen, and both entire arms.',
  'Mwanaume wa miaka 30 mwenye uzito wa kilo 70 analetwa hospitalini saa 2 baada ya mlipuko wa mtungi wa gesi. Anakutwa na majeraha ya kuungua ya digrii ya 2 na ya 3 kifuani kote, tumboni mbele, na mikono yote miwili mizima.',
  'Testing Rule of Nines calculation (Chest + Abdomen anterior = 18%, Both entire arms = 9% + 9% = 18%; Total TBSA = 36%). Parkland formula = 4ml x kg x %TBSA. Critical trap: Giving half of total fluids within 8 hours from time of burn, NOT time of hospital arrival.',
  'Estimate 20% burn, connect 1 liter of 5% Dextrose, and apply silver sulfadiazine cream before inserting IV lines.',
  'Kadiria kuwa ameungua 20%, mwekee lita moja ya Dextrose 5%, na umpake mafuta ya silver sulfadiazine kabla ya kuweka dripu.',
  'Calculate Total Burn Surface Area (TBSA): Anterior trunk = 18%, Both upper limbs = 18%, Total = 36% TBSA. Apply Parkland formula: 4 ml x 70 kg x 36 = 10,080 ml of Ringer Lactate in 24 hours. Give first half (5,040 ml) within 8 hours FROM THE TIME OF INJURY (since 2 hours elapsed, remaining 5,040 ml must run over the next 6 hours = 840 ml/hr). Give second half (5,040 ml) over remaining 16 hours. Monitor hourly urine output target 0.5-1 ml/kg/hr (35-70 ml/hr).',
  'Piga hesabu ya eneo lililoungua (TBSA): Kifua na tumbo mbele = 18%, mikono yote miwili = 18%, Jumla = 36%. Tumia fomula ya Parkland: 4 ml x 70 kg x 36 = 10,080 ml ya Ringer Lactate kwa masaa 24. Nusu ya kwanza (5,040 ml) inapaswa kuisha ndani ya masaa 8 TANGU KUTOKEA AJALI (kwa kuwa masaa 2 yamepita, 5,040 ml iliyobaki iingie ndani ya masaa 6 yajayo = 840 ml kwa saa). Fuatilia kiwango cha mkojo kila saa kiwe 35-70 ml/hr.',
  96, 'Burns Unit Lead Nurse, KNH', 1
),
(
  'acute-meningitis-lumbar-puncture-signs',
  'Pediatric Bacterial Meningitis & Raised ICP Signs',
  'Homa ya Uti wa Mgongo kwa Mtoto na Shinikizo la Kichwa',
  '4', 'Pediatrics', 'Trap / Safety', 'experienced',
  'A 4-year-old child presents with high fever, neck stiffness, photophobia, and altered consciousness. The junior medical officer requests immediate assistance to hold the child in knee-chest flexion for emergency lumbar puncture. You notice the child has unequal sluggish pupils, bradycardia (HR 56), and hypertension (BP 130/85).',
  'Mtoto wa miaka 4 analetwa na homa kali, shingo kukakamaa, kutovumilia mwanga, na akili kuchanganyikiwa. Daktari msaidizi anakuomba ushikilie mtoto kwa nguvu umkunje magoti kifuani ili achukue maji ya mgongo (lumbar puncture). Unagundua mtoto ana mboni za macho zisizolingana, mapigo ya moyo yako chini sana (56), na BP iko juu (130/85).',
  'Recognizing Cushing triad (bradycardia, hypertension, irregular breathing) and unequal pupils as imminent brain herniation where lumbar puncture is strictly contraindicated until CT scan excludes mass effect.',
  'Hold the child firmly in curled fetal flexion position immediately so the doctor can tap the spinal canal before antibiotics.',
  'Mshikilie mtoto kwa nguvu sana akiwa amejikunja ili daktari atoboe mgongo kuchukua maji kabla ya kumpa dawa.',
  'Advocate firmly for patient safety and halt the lumbar puncture procedure immediately! The child exhibits Cushing triad and pupillary asymmetry indicating severely elevated intracranial pressure with risk of fatal cerebellar/uncal herniation upon dural puncture. Start empiric IV antibiotics (Ceftriaxone 100mg/kg) and Dexamethasone without waiting for LP, elevate head of bed 30 degrees, administer oxygen, and request emergency head CT scan.',
  'Mtetee mgonjwa na usimamishe kitendo cha kutoa maji ya mgongo mara moja! Mtoto ana dalili za hatari za Cushing triad (shinikizo kubwa la ubongo) na mboni zisizolingana; kutoboa mgongo kunaweza kusababisha ubongo kubonyezeka kuelekea chini na kumuua papo hapo. Anzisha dawa za Ceftriaxone IV na Dexamethasone mara moja bila kusubiri LP, inua kichwa cha kitanda nyuzi 30, na ufanye mpango wa CT scan ya dharura.',
  98, 'Pediatric Critical Care Nurse, Gertrude''s Children Hospital', 1
),
(
  'post-op-parathyroid-hypocalcemia-tetany',
  'Acute Hypocalcemia & Chvostek Sign Post-Parathyroidectomy',
  'Kushuka kwa Madini ya Calcium na Dalili ya Chvostek Baada ya Upasuaji',
  '5', 'Surgical', 'Assessment Priority', 'bsc',
  'On Day 2 post-parathyroidectomy, a female patient reports severe numbness and tingling around her lips (perioral paresthesia) and cramping in her hands (carpopedal spasm when BP cuff is inflated). Tapping over the facial nerve in front of her ear elicits immediate twitching of her mouth.',
  'Siku ya pili baada ya upasuaji wa tezi ya parathyroid, mgonjwa analalamika kufa ganzi na miwasho kando ya midomo yake na mikono kujikunja kwa maumivu wakati BP inapopimwa. Ukigonga kando ya sikio lake kwenye mshipa wa uso, mdomo unajivuta mara moja.',
  'Testing recognition of Trousseau and Chvostek signs of severe acute hypocalcemia requiring emergency IV Calcium Gluconate with continuous cardiac monitoring.',
  'Reassure the patient that tingling is expected after neck surgery and provide oral chewable calcium carbonate tablets with lunch.',
  'Mtulize mgonjwa umwambie ni kawaida shingo kuwasha baada ya upasuaji na umpe vidonge vya kumeza vya calcium wakati wa chakula.',
  'Recognize acute hypocalcemic tetany. Keep patient safe and calm. Immediately prepare and administer 10% Calcium Gluconate (10-20 ml in 50-100 ml 5% Dextrose) IV slowly over 10 to 20 minutes under continuous cardiac rhythm monitoring (to detect bradycardia or QT shortening). Keep emergency tracheostomy set at bedside as hypocalcemia can trigger laryngeal spasm.',
  'Tambua hii ni tetany hatari inayotokana na ukosefu wa calcium. Andaa na utoe Calcium Gluconate ya 10% (10-20 ml kwenye Dextrose 5%) kwa mshipa polepole sana kwa muda wa dakika 10-20 huku ukifuatilia mwenendo wa moyo kwenye mashine. Weka trei ya tracheostomy tayari kitandani kwani koo linaweza kujikunja na kuziba hewa (laryngospasm).',
  94, 'Nurse Educator, Aga Khan Hospital', 1
),
(
  'cord-prolapse-labor-emergency',
  'Umbilical Cord Prolapse During Spontaneous Labor',
  'Kutoka kwa Kitovu Kabla ya Mtoto Wakati wa Kujifungua',
  '3', 'Maternity', 'Order of Operations', '1yr',
  'During active labor, a multiparous woman experiences sudden spontaneous rupture of membranes. On routine vaginal examination, you palpate a pulsating loop of umbilical cord protruding ahead of the fetal head into the vagina. Fetal heart rate abruptly drops from 140 to 75 bpm.',
  'Wakati wa uchungu wa uzazi, chupa ya uzazi inapasuka ghafla. Ukifanya uchunguzi wa ndani wa uke, unahisi kitovu kikiwa kinapiga mapigo kikitoka kabla ya kichwa cha mtoto. Mapigo ya mtoto yanashuka ghafla kutoka 140 hadi 75 kwa dakika.',
  'Recognizing cord prolapse as catastrophic obstetric emergency requiring immediate elevation of presenting part off the cord, knee-chest or exaggerated Trendelenburg position, and emergency cesarean section without attempting to push cord back.',
  'Carefully push the protruding umbilical cord back up into the uterine cavity with sterile gauze and instruct the mother to bear down.',
  'Kandamiza kile kitovu ukirudishe ndani ya mji wa uzazi ukitumia shashi safi na umwambie mama asukume mtoto kwa nguvu.',
  'Never push cord back into uterus. Call for immediate obstetric emergency assistance. Keep your gloved hand in the vagina, applying continuous upward manual pressure on the fetal presenting part to elevate it off the cord and relieve compression until delivery. Immediately place mother in knee-chest position or steep Trendelenburg. Administer high-flow oxygen, cover exposed cord with warm sterile saline-soaked swabs, stop oxytocin if running, and rush directly to theatre for emergency cesarean section.',
  'USIRUDISHE kitovu ndani kamwe! Piga kelele kuomba msaada wa haraka wa madaktari wa upasuaji. Baki na mkono wako wenye glovu ndani ya uke ukisukuma kichwa cha mtoto juu ili kisikandamize kitovu hadi mtoto atakapotolewa kwa upasuaji. Mweke mama kwenye mkao wa magoti kifuani (knee-chest). Mfunike kile kitovu kilichotoka kwa kitambaa chenye maji moto ya chumvi (saline), na mumkimbize ukumbini mwa upasuaji mara moja.',
  99, 'Senior Midwife, Pumwani Maternity Hospital', 1
),
(
  'opioid-overdose-respiratory-arrest-naloxone',
  'Postoperative Opioid Overdose & Respiratory Depression',
  'Kuzidiwa na Dawa za Usingizi/Kutuliza Maumivu Baada ya Upasuaji',
  '4', 'Surgical', 'Drug Choice & Priority', 'no-exp',
  'A 52-year-old male receives patient-controlled IV Morphine after abdominal surgery. When the nurse checks vitals, the patient is unarousable to painful stimuli, with pinpoint pupils, respiratory rate of 4 breaths per minute, and SpO2 76%.',
  'Mwanaume wa miaka 52 anapewa Morphine ya mshipa baada ya upasuaji wa tumbo. Muuguzi anapopima afya anamkuta haamki hata akichimbiwa kucha, mboni zimekuwa ndogo kama ncha ya sindano, anapumua mara 4 tu kwa dakika, na oksijeni iko 76%.',
  'Testing prompt recognition of opioid toxicity triad (unconsciousness, pinpoint pupils, bradypnea) and administration of titrated IV Naloxone over bagging alone.',
  'Apply a cold towel to the patient''s forehead, shake him vigorously, and administer 100% oxygen via nasal prongs while waiting for him to wake up.',
  'Weka kitambaa cha baridi usoni mwake, mtikise kwa nguvu, na umwekee oksijeni puani huku ukisubiri azinduke.',
  'Recognize life-threatening opioid overdose. Immediately call for resuscitation assistance. Support ventilation with bag-valve-mask with 100% oxygen. Administer Naloxone IV 0.4mg (titrated in 0.1-0.2mg increments every 2-3 minutes) until adequate spontaneous respirations resume. Continue monitoring closely for re-sedation as morphine has a longer half-life than naloxone.',
  'Tambua hii ni hatari ya overdose ya morphine. Piga mayowe kuomba msaada wa resuscitation. Msaidie kupumua kwa bag-valve-mask yenye oksijeni ya 100%. Mchome dawa ya Naloxone IV 0.4mg (ikigawanywa 0.1-0.2mg kila baada ya dakika 2-3) hadi aanze kupumua mwenyewe vizuri. Endelea kumchunga kwa karibu kwani nguvu ya naloxone huisha kabla ya morphine mwilini.',
  95, 'Nurse Anesthetist, Nairobi Hospital', 1
),
(
  'post-op-hemorrhage-splenectomy-tachycardia',
  'Occult Post-Splenectomy Intra-Abdominal Bleeding',
  'Kuvuja Damu Ndani ya Tumbo Baada ya Upasuaji wa Wengu',
  '5', 'Surgical', 'Assessment Priority', 'experienced',
  'A 38-year-old trauma victim underwent emergency splenectomy 4 hours ago. His surgical abdominal drain has only produced 30ml of serosanguinous fluid. However, his heart rate has progressively climbed from 88 to 138 bpm, BP dropped from 125/80 to 86/52 mmHg, abdomen is distended and firm, and urine output is 10ml over the last hour.',
  'Mwanaume wa miaka 38 aliyefanyiwa upasuaji wa kutolewa wengu (splenectomy) saa 4 zilizopita ana bomba la tumbo lililotoa 30ml tu za maji mekundu. Hata hivyo, mapigo ya moyo yamepanda kutoka 88 hadi 138 kwa dakika, BP imeporomoka hadi 86/52, tumbo limevimba na kukakamaa, na ametoa mkojo 10ml tu kwa saa iliyopita.',
  'Recognizing false reassurance from a blocked surgical drain; progressive tachycardia and narrowing pulse pressure in post-op abdominal surgery are classic signs of concealed hemorrhage requiring surgical re-exploration.',
  'Assume patient is dehydrated due to low drain output, give 500ml oral fluids, and reposition the drain tubing to see if more fluid flows.',
  'Dhania kuwa mgonjwa ana upungufu wa maji kwa sababu bomba halijatoa kitu, mpe maji ya kunywa na unyooshe ule mpira.',
  'Recognize concealed intra-abdominal hemorrhage with blocked drain. Do not be deceived by low drain output. Rapidly activate surgical emergency recall. Lay patient supine with legs elevated, establish two large-bore IV access points, begin rapid volume resuscitation with warmed crystalloids and uncrossmatched O-negative blood (or matched packed cells), take urgent blood for hemoglobin and crossmatch, insert urinary catheter, and prepare patient immediately for re-laparotomy.',
  'Tambua kuna uvujaji mkubwa wa damu ndani ya tumbo na lile bomba limeziba. Usidanganywe na bomba kutoa kidogo. Washa kengele ya dharura ya upasuaji mara moja. Mlaze chini inua miguu, fungua mishipa miwili mikubwa ya dripu, mimina maji na damu ya O-negative haraka, pima hemoglobin tena, weka mpira wa mkojo, na umwandae mgonjwa kurudishwa ukumbini mwa upasuaji (theatre) mara moja.',
  97, 'Trauma ICU Nursing Officer, KNH', 1
)
ON CONFLICT (slug) DO NOTHING;

-- 3. DRUG CALCULATIONS (20 Realistic Clinical Drills)
INSERT INTO drug_calcs (question, options, correct_index, explanation)
VALUES
(
  'A physician orders IV Ceftriaxone 750 mg for a child with severe pneumonia. The available vial contains 1 gram of Ceftriaxone powder. You reconstitute the vial with 10 ml of sterile water for injection. How many milliliters (ml) should you administer?',
  '["5.0 ml", "7.5 ml", "10.0 ml", "2.5 ml"]'::jsonb,
  1,
  'Desired dose = 750 mg. Stock available = 1,000 mg in 10 ml (100 mg/ml). Volume to draw = 750 mg ÷ 100 mg/ml = 7.5 ml.'
),
(
  'An order requests 1,000 ml of Normal Saline 0.9% to run over 8 hours using a standard adult IV macro-drip administration set (drop factor = 20 drops/ml). What is the correct drip rate in drops per minute?',
  '["42 drops/min", "21 drops/min", "63 drops/min", "30 drops/min"]'::jsonb,
  0,
  'Drip rate formula = (Total Volume in ml x Drop Factor) ÷ Time in minutes. (1,000 ml x 20 drops/ml) ÷ (8 x 60 mins) = 20,000 ÷ 480 = 41.67 ≈ 42 drops per minute.'
),
(
  'A neonate weighing 3.2 kg requires IV Ampicillin at 50 mg/kg/dose every 12 hours. The vial contains 500 mg reconstituted with 5 ml of water (100 mg/ml). What volume in ml is administered per dose?',
  '["1.6 ml", "3.2 ml", "0.8 ml", "2.4 ml"]'::jsonb,
  0,
  'Total dose needed = 3.2 kg x 50 mg/kg = 160 mg. Concentration = 500 mg / 5 ml = 100 mg/ml. Volume = 160 mg ÷ 100 mg/ml = 1.6 ml.'
),
(
  'You are preparing a maintenance IV infusion of Magnesium Sulfate for an eclamptic mother. The order is 1 gram/hour. You add 10 grams of 50% Magnesium Sulfate (20 ml) to 480 ml of Ringer Lactate to make 500 ml total solution. At what rate in ml/hr should the infusion pump run?',
  '["50 ml/hr", "25 ml/hr", "100 ml/hr", "20 ml/hr"]'::jsonb,
  0,
  'Total volume = 500 ml containing 10 grams. Concentration = 10 g / 500 ml = 0.02 g/ml (or 1 g per 50 ml). To deliver 1 g/hour, set infusion rate to 50 ml/hr.'
),
(
  'A 12 kg toddler with bacterial sepsis requires Gentamicin 7.5 mg/kg once daily IV. The ampoule contains Gentamicin 80 mg in 2 ml. What volume in milliliters should be administered?',
  '["1.12 ml", "2.25 ml", "1.50 ml", "3.00 ml"]'::jsonb,
  1,
  'Desired dose = 12 kg x 7.5 mg/kg = 90 mg. Stock concentration = 80 mg in 2 ml = 40 mg/ml. Volume needed = 90 mg ÷ 40 mg/ml = 2.25 ml.'
),
(
  'A 60 kg adult in septic shock requires an initial fluid resuscitation bolus of 30 ml/kg of IV Ringer Lactate within the first 3 hours. How many 500 ml bottles of Ringer Lactate must be infused?',
  '["2 bottles", "3.6 bottles", "4 bottles (1,800 ml)", "6 bottles"]'::jsonb,
  2,
  'Total volume = 60 kg x 30 ml/kg = 1,800 ml. 1,800 ml ÷ 500 ml/bottle = 3.6 bottles (infusing 3 full 500 ml bottles + 300 ml of a 4th bottle; total 1,800 ml).'
),
(
  'A patient in post-op recovery is prescribed IV Morphine 4 mg stat. The ampoule contains Morphine 10 mg/ml. You dilute the 1 ml ampoule with 9 ml of Normal Saline to make 10 ml total (1 mg/ml). How many ml do you inject?',
  '["2 ml", "4 ml", "0.4 ml", "6 ml"]'::jsonb,
  1,
  'Diluted concentration = 10 mg in 10 ml = 1 mg/ml. For 4 mg dose, administer 4 ml.'
),
(
  'A pediatric patient requires 500 ml of pediatric maintenance fluid over 24 hours via a pediatric micro-drip infusion set (drop factor = 60 drops/ml). What is the drip rate in drops per minute?',
  '["15 drops/min", "21 drops/min", "25 drops/min", "30 drops/min"]'::jsonb,
  1,
  'Drip rate = (500 ml x 60 drops/ml) ÷ (24 x 60 mins) = 500 ÷ 24 = 20.83 ≈ 21 drops/min (with a 60 drops/ml micro-set, drops/min equals ml/hr).'
),
(
  'An adult patient is ordered Paracetamol 1,000 mg IV infusion over 15 minutes. The bottle contains 100 ml (10 mg/ml). What is the flow rate in ml/hr on the infusion pump?',
  '["200 ml/hr", "400 ml/hr", "100 ml/hr", "300 ml/hr"]'::jsonb,
  1,
  'Rate (ml/hr) = Volume (ml) ÷ Time (hr). 15 minutes = 0.25 hours. 100 ml ÷ 0.25 hr = 400 ml/hr.'
),
(
  'A 5-year-old child weighing 18 kg is diagnosed with malaria and prescribed oral Artemether-Lumefantrine (Coartem). The weight-based dosing band is 15-25 kg (2 tablets twice daily for 3 days). How many total tablets will the child consume over the entire course?',
  '["6 tablets", "12 tablets", "18 tablets", "24 tablets"]'::jsonb,
  1,
  '2 tablets per dose x 2 doses per day = 4 tablets daily. 4 tablets/day x 3 days = 12 tablets total.'
),
(
  'A doctor prescribes IV Hydrocortisone 150 mg. The vial contains 100 mg of powder. You reconstitute each 100 mg vial with 2 ml of water (50 mg/ml). How many ml do you administer from reconstituted vials?',
  '["2.5 ml", "3.0 ml", "1.5 ml", "4.0 ml"]'::jsonb,
  1,
  'Concentration = 100 mg in 2 ml = 50 mg/ml. For 150 mg: 150 mg ÷ 50 mg/ml = 3.0 ml (reconstituting two vials and drawing 3 ml).'
),
(
  'A post-partum mother with uterine atony receives an infusion of Oxytocin 20 IU in 500 ml Normal Saline running at 125 ml/hr. How many International Units (IU) of Oxytocin is she receiving per hour?',
  '["2.5 IU/hr", "5.0 IU/hr", "10.0 IU/hr", "1.25 IU/hr"]'::jsonb,
  1,
  'Oxytocin concentration = 20 IU ÷ 500 ml = 0.04 IU/ml. Dose per hour = 125 ml/hr x 0.04 IU/ml = 5.0 IU/hr.'
),
(
  'A child with asthma exacerbation weighing 20 kg is ordered oral Prednisolone 1 mg/kg/day for 3 days. Available is Prednisolone syrup 15 mg/5 ml. What volume in ml should the mother give per day?',
  '["5.0 ml", "6.7 ml", "10.0 ml", "3.3 ml"]'::jsonb,
  1,
  'Desired dose = 20 kg x 1 mg/kg = 20 mg/day. Concentration = 15 mg in 5 ml = 3 mg/ml. Volume = 20 mg ÷ 3 mg/ml = 6.67 ml ≈ 6.7 ml.'
),
(
  'An unconscious diabetic patient with hypoglycemia requires 50 ml of 50% Dextrose IV. How many grams of glucose are contained in this 50 ml dose?',
  '["25 grams", "50 grams", "10 grams", "5 grams"]'::jsonb,
  0,
  '50% Dextrose means 50 grams of dextrose per 100 ml. In 50 ml, there are 50 x (50 / 100) = 25 grams of pure glucose.'
),
(
  'A doctor orders regular Insulin 10 units subcutaneously. You have an insulin syringe calibrated at 100 units/ml (U-100). What volume in ml does this 10 unit mark represent?',
  '["0.01 ml", "0.1 ml", "1.0 ml", "0.05 ml"]'::jsonb,
  1,
  'U-100 insulin means 100 units = 1.0 ml. Therefore 10 units = 10 ÷ 100 = 0.1 ml.'
),
(
  'A patient in cardiac arrest requires 1 mg of Adrenaline IV. The emergency trolley has Adrenaline 1:10,000 prefilled syringes. What volume should you inject?',
  '["1 ml", "5 ml", "10 ml", "0.1 ml"]'::jsonb,
  2,
  '1:10,000 concentration means 1 gram in 10,000 ml = 1,000 mg in 10,000 ml = 0.1 mg/ml. To deliver 1 mg: 1 mg ÷ 0.1 mg/ml = 10 ml.'
),
(
  'A premature infant weighing 1.5 kg requires IV caffeine citrate loading dose 20 mg/kg. The solution is 20 mg/ml. What volume in ml do you administer?',
  '["0.75 ml", "1.5 ml", "3.0 ml", "0.5 ml"]'::jsonb,
  1,
  'Dose = 1.5 kg x 20 mg/kg = 30 mg. Concentration = 20 mg/ml. Volume = 30 mg ÷ 20 mg/ml = 1.5 ml.'
),
(
  'An IV line of 500 ml 5% Dextrose is running at 30 drops/minute with a drop factor of 20 drops/ml. How long will this bottle last in hours and minutes?',
  '["4 hours 30 mins", "5 hours 33 mins", "6 hours", "3 hours 45 mins"]'::jsonb,
  1,
  'Time (mins) = (Volume x Drop Factor) ÷ Drip Rate = (500 x 20) ÷ 30 = 10,000 ÷ 30 = 333.3 minutes = 5 hours and 33 minutes.'
),
(
  'A child with acute otitis media is ordered Amoxicillin suspension 40 mg/kg/day divided into 3 doses. The child weighs 15 kg. Available is Amoxicillin 125 mg/5 ml. What volume in ml is given for EACH individual dose?',
  '["4 ml", "8 ml", "12 ml", "2.5 ml"]'::jsonb,
  1,
  'Total daily dose = 15 kg x 40 mg/kg = 600 mg/day. Divided into 3 doses = 200 mg per dose. Concentration = 125 mg in 5 ml = 25 mg/ml. Volume per dose = 200 mg ÷ 25 mg/ml = 8 ml.'
),
(
  'A post-operative patient is prescribed Heparin 5,000 units subcutaneously. The vial contains 25,000 units in 5 ml. What volume should you inject?',
  '["0.5 ml", "1.0 ml", "2.0 ml", "0.2 ml"]'::jsonb,
  1,
  'Stock concentration = 25,000 units in 5 ml = 5,000 units/ml. For a 5,000 unit dose, draw 1.0 ml.'
)
ON CONFLICT DO NOTHING;

-- 4. WARD TIPS (30 Authentic Practical Insights from Kenyan Nursing Officers)
INSERT INTO ward_tips (tip, department)
VALUES
  ('Never give potassium chloride as a direct IV bolus under any circumstance. It must always be diluted in IV fluids and infused at a rate not exceeding 10-20 mEq/hour to prevent fatal cardiac arrest.', 'Medical'),
  ('When handing over in Maternity, always do bedside handover—never station-only handover. Confirm the uterine tone, lochia flow, and bladder fullness of post-delivery mothers with your own hands before taking over.', 'Maternity'),
  ('In pediatric drug calculations, double-check every dosage with a second registered nurse before drawing up. A decimal point error can be a ten-fold overdose.', 'Pediatrics'),
  ('When preparing an eclamptic mother for Magnesium Sulfate, always check three things before every 4-hourly maintenance dose: patellar tendon reflex present, respiratory rate above 16 bpm, and urine output above 30 ml/hour.', 'Maternity'),
  ('A post-thyroidectomy bedside table MUST always have a sterile tracheostomy tray, clip remover or suture cutter, and a working suction machine ready for emergency hematoma decompression.', 'Surgical'),
  ('Do not rely on the abdominal drain bag to tell you if a patient is bleeding internally. Check pulse rate and pulse pressure—tachycardia often precedes blood pressure drop by hours.', 'Surgical'),
  ('In the event of accidental needle stick injury, immediately wash the area under running water and soap without forcefully squeezing or sucking. Report to PEP coordinator within 72 hours (ideally within 2 hours).', 'General'),
  ('Cold chain maintenance for vaccines is non-negotiable: Keep vaccines strictly between +2°C and +8°C. Record temperatures twice daily in the morning and evening on the chart.', 'Pediatrics'),
  ('When catheterizing an adult male, advance the Foley catheter all the way to the "Y" bifurcation before inflating the retention balloon to avoid urethral rupture.', 'Surgical'),
  ('Always check the expiry date of the resuscitation ambu bag and test the one-way valve seal against the palm of your hand before a delivery begins.', 'Maternity'),
  ('Adrenaline in anaphylaxis is given INTRAMUSCULARLY into the mid-anterolateral thigh, NOT subcutaneously. IM absorption in the vastus lateralis is five times faster.', 'Casualty'),
  ('When performing chest compressions on an adult, push hard and push fast: 100-120 compressions per minute at a depth of 5-6 cm, allowing complete chest recoil between compressions.', 'General'),
  ('Never leave a patient unattended after administering the first dose of IV Ceftriaxone or blood transfusion. Adverse reactions happen predominantly within the first 15 minutes.', 'Medical'),
  ('In burns resuscitation, calculating fluid from the time of injury rather than hospital arrival is the hallmark difference between an average nurse and a master clinical nurse.', 'Casualty'),
  ('For sickle cell crises in pediatrics, hydration and aggressive multimodal pain relief are life-saving. Never withhold adequate analgesia based on fear of addiction.', 'Pediatrics'),
  ('In Kenya NCK board oral examinations, when asked what to do first, always start with: "I will ensure airway patency, adequate breathing, and circulation (ABC), while calling for help."', 'General'),
  ('Label every IV infusion bottle with: Patient Name, Drug added, Date, Time started, Drops per minute, and your signature. Never leave an unlabeled infusion running.', 'Medical'),
  ('When handling cytotoxic chemotherapeutic agents or cleaning spills, wear two pairs of chemo-tested nitrile gloves, eye protection, and use an impervious gown.', 'Oncology'),
  ('A silent chest in a severe asthma attack is not a sign of improvement; it is an ominous sign of imminent respiratory exhaustion and arrest.', 'Casualty'),
  ('Ensure a working oxygen concentrator or cylinder backup is available before transferring an unstable patient between wards or to the CT scan room.', 'Casualty'),
  ('Before administering Digoxin, always check apical pulse for one full minute. Withhold the dose and notify the physician if heart rate is below 60 bpm in adults or below 90 bpm in infants.', 'Medical'),
  ('Proper positioning for lumbar puncture in pediatrics: Flex hips and knees without hyperflexing the neck, which can compromise the airway in small infants.', 'Pediatrics'),
  ('For diabetic foot ulcers, never apply tight occlusive dressings. Inspect both feet daily, including between the toes, and educate on wearing protective, well-fitting footwear.', 'Surgical'),
  ('When removing an epidural catheter, inspect the tip to confirm the black indicator mark is intact, verifying no catheter fragment was sheared off in the epidural space.', 'Surgical'),
  ('In suspected acute stroke, note the exact time the patient was last seen normal ("Last Known Well"). This determines eligibility for thrombolysis (4.5-hour window).', 'Medical'),
  ('Prevent pressure ulcers by turning immobile patients every 2 hours, keeping bed linen wrinkle-free, and using barrier creams on pressure points over bony prominences.', 'Medical'),
  ('When suctioning an endotracheal tube, limit each suction pass to 10-15 seconds and pre-oxygenate with 100% O2 before and after to prevent severe hypoxemia and bradycardia.', 'ICU'),
  ('In neonatal resuscitation, if the baby remains apnoeic after thorough drying and stimulation, do not waste time; begin Bag-Valve-Mask ventilation within the first 60 seconds (The Golden Minute).', 'Maternity'),
  ('Dispose of sharps immediately into the yellow puncture-proof sharps box at point of care. Never recap used needles with two hands—use the one-handed scoop technique if necessary.', 'General'),
  ('Treat every patient with dignity and confidentiality. Never discuss patient details, diagnoses, or bed numbers in public corridors, elevators, or on social media.', 'General')
ON CONFLICT DO NOTHING;
