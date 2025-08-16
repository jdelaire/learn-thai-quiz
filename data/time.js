(function(g){
  g.ThaiData = g.ThaiData || {};
  g.ThaiData.time = {
    keyWords: JSON.parse(`[
      {"english":"Hour (o’clock)","thai":"โมง","phonetic":"mooŋ"},
      {"english":"Hour (o’clock)","thai":"ทุ่ม","phonetic":"thûm"},
      {"english":"Hour (o’clock)","thai":"นาฬิกา","phonetic":"naa-lí-gaa"},
      {"english":"Minute","thai":"นาที","phonetic":"naa-thii"},
      {"english":"Second","thai":"วินาที","phonetic":"wí-naa-thii"},
      {"english":"Time","thai":"เวลา","phonetic":"wee-laa"},
      {"english":"O’clock sharp","thai":"ตรง","phonetic":"dtroŋ"},
      {"english":"Half past (30 min)","thai":"ครึ่ง","phonetic":"khrɯ̂ŋ"},
      {"english":"Quarter","thai":"หนึ่งในสี่","phonetic":"nɯ̀ŋ nai sìi"},
      {"english":"Early morning (1–5 AM)","thai":"ตี…","phonetic":"dtii …"},
      {"english":"Morning (6–11 AM)","thai":"…โมงเช้า","phonetic":"…mooŋ cháo"},
      {"english":"Noon","thai":"เที่ยง","phonetic":"thîaŋ"},
      {"english":"Afternoon (1–3 PM)","thai":"บ่าย…โมง","phonetic":"bàay … mooŋ"},
      {"english":"Late afternoon (4–6 PM)","thai":"…โมงเย็น","phonetic":"…mooŋ yen"},
      {"english":"Evening/Night (7–11 PM)","thai":"…ทุ่ม","phonetic":"…thûm"},
      {"english":"Midnight","thai":"เที่ยงคืน","phonetic":"thîaŋ-kʉʉn"}
    ]`),
    timeFormats: JSON.parse(`[
      {"thai":"ตีหนึ่ง","phonetic":"dtii nɯ̀ŋ","note":"1 AM"},
      {"thai":"หกโมงเช้า","phonetic":"hòk mooŋ cháo","note":"6 AM"},
      {"thai":"เที่ยง","phonetic":"thîaŋ","note":"12 PM (noon)"},
      {"thai":"บ่ายโมง","phonetic":"bàay mooŋ","note":"1 PM"},
      {"thai":"บ่ายสามโมง","phonetic":"bàay săam mooŋ","note":"3 PM"},
      {"thai":"สี่โมงเย็น","phonetic":"sìi mooŋ yen","note":"4 PM"},
      {"thai":"สองทุ่ม","phonetic":"sǒn thûm","note":"8 PM"},
      {"thai":"เที่ยงคืน","phonetic":"thîaŋ-kʉʉn","note":"12 AM (midnight)"}
    ]`),
    examples: JSON.parse(`[
      {"thai":"กี่โมงแล้ว?","phonetic":"gìi mooŋ lɛ́ɛo?","translation":"What time is it now?"},
      {"thai":"ตอนนี้เป็นสี่โมงเย็น","phonetic":"tîi-níi bpen sìi mooŋ yen","translation":"It’s 4 PM"},
      {"thai":"ผมตื่นเช้าตีสี่","phonetic":"phǒm tam ŋaan tʉ̀ʉn cháo sìi dtii","translation":"I wake up at 4 AM"},
      {"thai":"ฉันมาถึงบ้านบ่ายสองโมง","phonetic":"chǎn maa thʉ̌ŋ bâan bàay sɔ̌ɔŋ mooŋ","translation":"I arrived home at 2 PM"},
      {"thai":"เราจะเจอกันหกโมงเช้าตรง","phonetic":"raw jà jer kan hòk mooŋ cháo dtrooŋ","translation":"Let’s meet at exactly 6 AM"},
      {"thai":"พักเบรกใช้เวลาสิบนาที","phonetic":"náam-phàk rao khᴐ̌ɔp chái wee-laa sìp naa-thii","translation":"The break takes 10 minutes"}
    ]`)
  };
})(window);