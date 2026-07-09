require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { sequelize, State, District, Block, GramPanchayat } = require('../src/models');

// ─── INDIA MASTER DATA ───────────────────────────────────────────────────────

const INDIA_DATA = [
  {
    name: 'Andaman & Nicobar Islands', code: 'AN',
    districts: ['Nicobar', 'North and Middle Andaman', 'South Andaman']
  },
  {
    name: 'Andhra Pradesh', code: 'AP',
    districts: [
      'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Bapatla', 'Chittoor',
      'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Konaseema',
      'Krishna', 'Kurnool', 'Nandyal', 'NTR', 'Palnadu',
      'Parvathipuram Manyam', 'Prakasam', 'SPSR Nellore', 'Sri Balaji', 'Sri Sathya Sai',
      'Srikakulam', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR'
    ]
  },
  {
    name: 'Arunachal Pradesh', code: 'AR',
    districts: [
      'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang',
      'Itanagar Capital Complex', 'Kamle', 'Kra Daadi', 'Kurung Kumey', 'Lepa Rada',
      'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang', 'Lower Subansiri',
      'Namsai', 'Pakke-Kessang', 'Papum Pare', 'Shi Yomi', 'Siang',
      'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'
    ]
  },
  {
    name: 'Assam', code: 'AS',
    districts: [
      'Bajali', 'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar',
      'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh',
      'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat',
      'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar',
      'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar',
      'Sonitpur', 'South Salmara-Mankachar', 'Tamulpur', 'Tinsukia', 'Udalguri',
      'West Karbi Anglong'
    ]
  },
  {
    name: 'Bihar', code: 'BR',
    districts: [
      'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur',
      'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj',
      'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
      'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda',
      'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur',
      'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul',
      'Vaishali', 'West Champaran'
    ]
  },
  {
    name: 'Chandigarh', code: 'CH',
    districts: ['Chandigarh']
  },
  {
    name: 'Chhattisgarh', code: 'CT',
    districts: [
      'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur',
      'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband',
      'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur', 'Kabirdham',
      'Kanker', 'Khairagarh-Chhuikhadan-Gandai', 'Kondagaon', 'Korba', 'Koriya',
      'Mahasamund', 'Manendragarh-Chirmiri-Bharatpur', 'Mohla-Manpur-Ambagarh Chowki',
      'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sakti',
      'Sarangarh-Bilaigarh', 'Sukma', 'Surajpur', 'Surguja'
    ]
  },
  {
    name: 'Dadra & Nagar Haveli and Daman & Diu', code: 'DN',
    districts: ['Dadra and Nagar Haveli', 'Daman', 'Diu']
  },
  {
    name: 'Delhi', code: 'DL',
    districts: [
      'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi',
      'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi',
      'South West Delhi', 'West Delhi'
    ]
  },
  {
    name: 'Goa', code: 'GA',
    districts: ['North Goa', 'South Goa']
  },
  {
    name: 'Gujarat', code: 'GJ',
    districts: [
      'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
      'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka',
      'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch',
      'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
      'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
      'Tapi', 'Vadodara', 'Valsad'
    ]
  },
  {
    name: 'Haryana', code: 'HR',
    districts: [
      'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram',
      'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra',
      'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari',
      'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'
    ]
  },
  {
    name: 'Himachal Pradesh', code: 'HP',
    districts: [
      'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu',
      'Lahaul & Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'
    ]
  },
  {
    name: 'Jammu & Kashmir', code: 'JK',
    districts: [
      'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal',
      'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch',
      'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian',
      'Srinagar', 'Udhampur'
    ]
  },
  {
    name: 'Jharkhand', code: 'JH',
    districts: [
      'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
      'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
      'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
      'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela-Kharsawan', 'Simdega',
      'West Singhbhum'
    ]
  },
  {
    name: 'Karnataka', code: 'KA',
    districts: [
      'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
      'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
      'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
      'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur',
      'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada',
      'Vijayapura', 'Vijayanagara', 'Yadgir'
    ]
  },
  {
    name: 'Kerala', code: 'KL',
    districts: [
      'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
      'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
      'Thiruvananthapuram', 'Thrissur', 'Wayanad'
    ]
  },
  {
    name: 'Ladakh', code: 'LA',
    districts: ['Kargil', 'Leh']
  },
  {
    name: 'Lakshadweep', code: 'LD',
    districts: ['Lakshadweep']
  },
  {
    name: 'Madhya Pradesh', code: 'MP',
    districts: [
      'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani',
      'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara',
      'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda',
      'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa',
      'Khargone', 'Maihar', 'Mandla', 'Mandsaur', 'Mauganj', 'Morena',
      'Narsinghpur', 'Neemuch', 'Niwari', 'Pandhurna', 'Panna', 'Raisen',
      'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni',
      'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli',
      'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'
    ]
  },
  {
    name: 'Maharashtra', code: 'MH',
    districts: [
      'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
      'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
      'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban',
      'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
      'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
      'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
    ]
  },
  {
    name: 'Manipur', code: 'MN',
    districts: [
      'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West',
      'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl',
      'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'
    ]
  },
  {
    name: 'Meghalaya', code: 'ML',
    districts: [
      'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills',
      'Eastern West Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills',
      'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills',
      'West Jaintia Hills', 'West Khasi Hills'
    ]
  },
  {
    name: 'Mizoram', code: 'MZ',
    districts: [
      'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib',
      'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Saitual', 'Serchhip'
    ]
  },
  {
    name: 'Nagaland', code: 'NL',
    districts: [
      'Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung',
      'Mon', 'Niuland', 'Noklak', 'Peren', 'Phek', 'Shamator',
      'Tseminyu', 'Tuensang', 'Wokha', 'Zunheboto'
    ]
  },
  {
    name: 'Odisha', code: 'OD',
    districts: [
      'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh',
      'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur',
      'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Keonjhar',
      'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh',
      'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
    ]
  },
  {
    name: 'Puducherry', code: 'PY',
    districts: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam']
  },
  {
    name: 'Punjab', code: 'PB',
    districts: [
      'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka',
      'Firozpur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana',
      'Malerkotla', 'Mansa', 'Moga', 'Mohali', 'Sri Muktsar Sahib', 'Nawanshahr',
      'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'Tarn Taran'
    ]
  },
  {
    name: 'Rajasthan', code: 'RJ',
    districts: [
      'Ajmer', 'Alwar', 'Anupgarh', 'Balotra', 'Banswara', 'Baran', 'Barmer',
      'Beawar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh',
      'Churu', 'Dausa', 'Deeg', 'Dholpur', 'Didwana-Kuchaman', 'Dudu',
      'Dungarpur', 'Gangapur City', 'Hanumangarh', 'Jaipur', 'Jaipur Rural',
      'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Jodhpur Rural',
      'Karauli', 'Kekri', 'Khairthal-Tijara', 'Kota', 'Kotputli-Behror',
      'Nagaur', 'Neem Ka Thana', 'Pali', 'Phalodi', 'Pratapgarh',
      'Rajsamand', 'Salumbar', 'Sanchore', 'Sawai Madhopur', 'Shahpura',
      'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
    ]
  },
  {
    name: 'Sikkim', code: 'SK',
    districts: ['East Sikkim', 'North Sikkim', 'Pakyong', 'South Sikkim', 'Soreng', 'West Sikkim']
  },
  {
    name: 'Tamil Nadu', code: 'TN',
    districts: [
      'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
      'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
      'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
      'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
      'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur',
      'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur',
      'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
      'Viluppuram', 'Virudhunagar'
    ]
  },
  {
    name: 'Telangana', code: 'TS',
    districts: [
      'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
      'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
      'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad',
      'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu',
      'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad',
      'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet',
      'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'
    ]
  },
  {
    name: 'Tripura', code: 'TR',
    districts: [
      'Dhalai', 'Gomati', 'Khowai', 'North Tripura',
      'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'
    ]
  },
  {
    name: 'Uttar Pradesh', code: 'UP',
    districts: [
      'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya',
      'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur',
      'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bijnor', 'Budaun',
      'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah',
      'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad',
      'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi',
      'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat',
      'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Lakhimpur Kheri', 'Kushinagar',
      'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura',
      'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit',
      'Pratapgarh', 'Prayagraj', 'Rae Bareli', 'Rampur', 'Saharanpur',
      'Sambhal', 'Sant Kabir Nagar', 'Sant Ravidas Nagar', 'Shahjahanpur',
      'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra',
      'Sultanpur', 'Unnao', 'Varanasi'
    ]
  },
  {
    name: 'Uttarakhand', code: 'UK',
    districts: [
      'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar',
      'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag',
      'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'
    ]
  },
  {
    name: 'West Bengal', code: 'WB',
    districts: [
      'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
      'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong',
      'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas',
      'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman',
      'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'
    ]
  },
];

// ─── HARYANA BLOCKS (comprehensive) ─────────────────────────────────────────
// key: "State|District" → array of block names
const HARYANA_BLOCKS = {
  'Ambala': ['Ambala I', 'Ambala II', 'Barara', 'Mullana', 'Naraingarh', 'Saha', 'Shahzadpur'],
  'Bhiwani': ['Bahal', 'Behal', 'Bhiwani', 'Bhudan', 'Kairu', 'Loharu', 'Siwani', 'Tosham'],
  'Charkhi Dadri': ['Baund Kalan', 'Badhra', 'Charkhi Dadri', 'Jhojhu Kalan'],
  'Faridabad': ['Ballabhgarh', 'Faridabad'],
  'Fatehabad': ['Bhattu Kalan', 'Bhuna', 'Fatehabad', 'Jakhal', 'Ratia', 'Tohana'],
  'Gurugram': ['Farukhnagar', 'Gurugram', 'Pataudi', 'Sohna'],
  'Hisar': ['Adampur', 'Agroha', 'Barwala', 'Hansi', 'Hisar', 'Narnaund', 'Uklana'],
  'Jhajjar': ['Bahadurgarh', 'Beri', 'Jhajjar', 'Machhrauli', 'Salhawas'],
  'Jind': ['Jind', 'Julana', 'Narwana', 'Pillu Khera', 'Safidon', 'Ucchana'],
  'Kaithal': ['Dhand', 'Guhla', 'Kalayat', 'Kaithal', 'Pundri', 'Rajaund', 'Siwan'],
  'Karnal': ['Assandh', 'Gharaunda', 'Indri', 'Karnal', 'Nilokheri', 'Nissing'],
  'Kurukshetra': ['Babain', 'Ismailabad', 'Ladwa', 'Pehowa', 'Shahabad', 'Thanesar'],
  'Mahendragarh': ['Ateli', 'Kanina', 'Mahendragarh', 'Nangal Chaudhary', 'Narnaul', 'Nizampur'],
  'Nuh': ['Ferozepur Jhirka', 'Nagina', 'Nuh', 'Punhana', 'Tauru'],
  'Palwal': ['Hassanpur', 'Hathin', 'Hodal', 'Palwal'],
  'Panchkula': ['Barwala', 'Morni', 'Panchkula', 'Raipur Rani'],
  'Panipat': ['Bapoli', 'Israna', 'Madlauda', 'Panipat', 'Samalkha'],
  'Rewari': ['Bawal', 'Dharuhera', 'Khol', 'Kosli', 'Nahar', 'Rewari'],
  'Rohtak': ['Asthal Bohar', 'Kahanaur', 'Lakhan Majra', 'Makrauli Kalan', 'Rohtak', 'Sanghi'],
  'Sirsa': ['Baragudha', 'Dabwali', 'Ellenabad', 'Nathusari Chopta', 'Odhan', 'Rania', 'Sirsa'],
  'Sonipat': ['Ganaur', 'Kharkhoda', 'Murthal', 'Mundlana', 'Rai', 'Sonipat'],
  'Yamunanagar': ['Bilaspur', 'Chhachhrauli', 'Jagadhri', 'Mustafabad', 'Radaur', 'Sadhaura'],
};

// ─── BHUNA GPs (from project XLSX) ───────────────────────────────────────────
const BHUNA_GPS = [
  { name: 'BHUTHAN KHURD', code: 'G001' },
  { name: 'NANDHORI', code: 'G002' },
  { name: 'JANDLI KALAN', code: 'G003' },
  { name: 'CHOBARA', code: 'G004' },
  { name: 'BAIJALPUR', code: 'G005' },
  { name: 'CHANDERAWAL', code: 'G006' },
  { name: 'BHUTHAN KALAN', code: 'G007' },
  { name: 'MOCHIWALI', code: 'G008' },
  { name: 'JANDLI KHURD', code: 'G009' },
  { name: 'GORAKHPUR', code: 'G010' },
  { name: 'NEHLA', code: 'G011' },
  { name: 'DEHMAN', code: 'G012' },
  { name: 'BHUNDRA', code: 'G013' },
  { name: 'SINTHLA', code: 'G014' },
  { name: 'DIGOH', code: 'G015' },
  { name: 'TIBBI', code: 'G016' },
  { name: 'DULAT', code: 'G017' },
  { name: 'LEHRIAN', code: 'G018' },
  { name: 'REHAN KHERI', code: 'G019' },
  { name: 'DHOLU', code: 'G020' },
  { name: 'KANIKHERI', code: 'G021' },
  { name: 'GHOTRU', code: 'G022' },
  { name: 'DHANI BHOJRAJ', code: 'G023' },
  { name: 'DHANI DULT', code: 'G024' },
  { name: 'BHATTU', code: 'G025' },
  { name: 'DHANI SANCHLA', code: 'G026' },
  { name: 'DHANI GOPAL', code: 'G027' },
  { name: 'BUWAN', code: 'G028' },
  { name: 'KHASAPATHANA', code: 'G029' },
  { name: 'BOSTI', code: 'G030' },
];

// ─── CSV IMPORTER ─────────────────────────────────────────────────────────────
// Expected CSV columns (LGD format):
// Block CSV: state_name, district_name, block_code, block_name
// GP CSV:    state_name, district_name, block_name, gp_code, gp_name
async function importFromCSV(filePath, type, districtMap, blockMap) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  let count = 0;
  const gpBatch = [];
  const blockBatch = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
    const row = {};
    header.forEach((h, idx) => { row[h] = cols[idx]; });

    if (type === 'blocks') {
      const parentId = districtMap[`${row.state_name?.toUpperCase()}|${row.district_name?.toUpperCase()}`];
      if (!parentId) continue;
      blockMap[`${row.state_name?.toUpperCase()}|${row.district_name?.toUpperCase()}|${row.block_name?.toUpperCase()}`] = null;
      blockBatch.push({ name: row.block_name, code: row.block_code, districtId: parentId, createdAt: new Date(), updatedAt: new Date() });
      count++;
    } else if (type === 'gps') {
      const blockKey = `${row.state_name?.toUpperCase()}|${row.district_name?.toUpperCase()}|${row.block_name?.toUpperCase()}`;
      const blockId = blockMap[blockKey];
      if (!blockId) continue;
      gpBatch.push({ name: row.gp_name, code: row.gp_code, blockId: blockId, createdAt: new Date(), updatedAt: new Date() });
      count++;
    }
    if (count % 500 === 0) process.stdout.write(`  ${count} records...\r`);
  }
  
  if (type === 'blocks' && blockBatch.length > 0) {
    await Block.bulkCreate(blockBatch, { ignoreDuplicates: true });
  } else if (type === 'gps' && gpBatch.length > 0) {
    // Process in chunks to avoid memory issues
    const chunkSize = 10000;
    for (let i = 0; i < gpBatch.length; i += chunkSize) {
      await GramPanchayat.bulkCreate(gpBatch.slice(i, i + chunkSize), { ignoreDuplicates: true });
    }
  }
  return count;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function seed() {
  await sequelize.sync({ alter: false });

  console.log('Clearing location data (Users preserved)...');
  await sequelize.query('PRAGMA foreign_keys = OFF');
  await GramPanchayat.destroy({ where: {} });
  await Block.destroy({ where: {} });
  await District.destroy({ where: {} });
  await State.destroy({ where: {} });
  await sequelize.query('PRAGMA foreign_keys = ON');

  // Maps for FK resolution
  const districtMap = {}; // "STATE|DISTRICT" → districtId
  const blockMap = {};    // "STATE|DISTRICT|BLOCK" → blockId

  // ── 1. Seed States + Districts ──────────────────────────────────────────────
  console.log('\n[1/3] Seeding states and districts...');
  let totalDistricts = 0;

  for (const sd of INDIA_DATA) {
    const state = await State.create({ name: sd.name, code: sd.code });

    for (const dName of sd.districts) {
      const district = await District.create({ name: dName, stateId: state.id });
      districtMap[`${sd.name.toUpperCase()}|${dName.toUpperCase()}`] = district.id;
    }
    totalDistricts += sd.districts.length;
    process.stdout.write(`  ${sd.name}: ${sd.districts.length} districts\n`);
  }
  console.log(`  Total: ${INDIA_DATA.length} states/UTs, ${totalDistricts} districts`);

  // ── 2. Seed Haryana Blocks ──────────────────────────────────────────────────
  console.log('\n[2/3] Seeding Haryana blocks...');
  let totalBlocks = 0;

  for (const [districtName, blocks] of Object.entries(HARYANA_BLOCKS)) {
    const key = `HARYANA|${districtName.toUpperCase()}`;
    const districtId = districtMap[key];
    if (!districtId) { console.warn(`  WARN: district not found: ${districtName}`); continue; }

    for (const blockName of blocks) {
      const block = await Block.create({ name: blockName, districtId });
      blockMap[`HARYANA|${districtName.toUpperCase()}|${blockName.toUpperCase()}`] = block.id;
      totalBlocks++;
    }
    console.log(`  ${districtName}: ${blocks.length} blocks`);
  }

  // ── 3. Seed Bhuna GPs ───────────────────────────────────────────────────────
  console.log('\n[3/3] Seeding Bhuna GPs...');
  const bhunaKey = 'HARYANA|FATEHABAD|BHUNA';
  const bhunaBlockId = blockMap[bhunaKey];

  if (bhunaBlockId) {
    for (const gp of BHUNA_GPS) {
      await GramPanchayat.create({ name: gp.name, code: gp.code, blockId: bhunaBlockId });
    }
    console.log(`  Bhuna: ${BHUNA_GPS.length} gram panchayats`);
  } else {
    console.warn('  WARN: Bhuna block not found');
  }

  // ── 4. Optional CSV import ──────────────────────────────────────────────────
  const dataDir = path.join(__dirname, '../data');
  const blocksCSV = path.join(dataDir, 'lgd-blocks.csv');
  const gpsCSV = path.join(dataDir, 'lgd-gps.csv');

  if (fs.existsSync(blocksCSV)) {
    console.log('\n[BONUS] Importing blocks from lgd-blocks.csv...');
    const n = await importFromCSV(blocksCSV, 'blocks', districtMap, blockMap);
    console.log(`  Imported ${n} blocks from CSV`);
  }

  if (fs.existsSync(gpsCSV)) {
    // rebuild blockMap from DB first
    const allBlocks = await Block.findAll();
    const allDistricts = await District.findAll({ include: [{ model: require('../src/models').State }] });
    const dMap = {};
    for (const d of allDistricts) {
      if (d.State) dMap[d.id] = { stateName: d.State.name, distName: d.name };
    }
    for (const b of allBlocks) {
      const parent = dMap[b.districtId];
      if (parent) {
        blockMap[`${parent.stateName.toUpperCase()}|${parent.distName.toUpperCase()}|${b.name.toUpperCase()}`] = b.id;
      }
    }
    console.log('\n[BONUS] Importing GPs from lgd-gps.csv...');
    const n = await importFromCSV(gpsCSV, 'gps', districtMap, blockMap);
    console.log(`  Imported ${n} GPs from CSV`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const stateCount = await State.count();
  const districtCount = await District.count();
  const blockCount = await Block.count();
  const gpCount = await GramPanchayat.count();

  console.log('\n═══════════════════════════════════');
  console.log(`States/UTs : ${stateCount}`);
  console.log(`Districts  : ${districtCount}`);
  console.log(`Blocks     : ${blockCount}`);
  console.log(`GPs        : ${gpCount}`);
  console.log('═══════════════════════════════════');

  if (blockCount < 100) {
    console.log('\nTo import ALL India blocks + GPs:');
    console.log('  1. Download from https://lgdirectory.gov.in → Downloads');
    console.log('  2. Save as backend/data/lgd-blocks.csv (cols: state_name,district_name,block_code,block_name)');
    console.log('  3. Save as backend/data/lgd-gps.csv    (cols: state_name,district_name,block_name,gp_code,gp_name)');
    console.log('  4. node scripts/seed-india.js');
  }

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
