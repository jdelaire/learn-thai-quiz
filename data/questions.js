(function(g){
  g.ThaiData = g.ThaiData || {};
  g.ThaiData.questions = {
    data: JSON.parse(`[
      {"english":"what","thai":"อะไร","phonetic":"à-rai"},
      {"english":"who","thai":"ใคร","phonetic":"khrai"},
      {"english":"where","thai":"ที่ไหน","phonetic":"thîi-nǎi"},
      {"english":"when","thai":"เมื่อไหร่","phonetic":"mûea-rài"},
      {"english":"why","thai":"ทำไม","phonetic":"tham-mai"},
      {"english":"have … yet","thai":"… หรือยัง","phonetic":"rw-yan"},
      {"english":"how","thai":"ยังไง","phonetic":"yaŋ-ŋai"},
      {"english":"how much","thai":"เท่าไหร่","phonetic":"thâo-rài"},
      {"english":"how many","thai":"กี่","phonetic":"gìi"},
      {"english":"which","thai":"ไหน","phonetic":"nǎi"},
      {"english":"is it … ?","thai":"… ไหม","phonetic":"… mái?"},
      {"english":"can … ?","thai":"… ได้ไหม","phonetic":"… dâay mái?"},
      {"english":"have you ever … ?","thai":"เคย … ไหม","phonetic":"khəəy … mái?"}
    ]`),
    examples: {
      'what': 'What is this? → an níi khʉʉ à-rai?',
      'who': 'Who is that? → khrai khʉʉ an nán?',
      'where': 'Where are you going? → khun jà bpai thîi-nǎi?',
      'when': 'When do you work? → khun tham ŋaan mûea-rài?',
      'why': 'Why do you like Thai food? → tham-mai khun chɔ̂ɔp aa-hǎan thai?',
      'how': 'How is the food? → aa-hǎan bpen yaŋ-ŋai?',
      'how much': 'How much is it? → an níi thâo-rài?',
      'how many': 'How many plates? → mii gìi jaan?',
      'which': 'Which one do you want? → khun ao an nǎi?',
      'is it … ?': 'Is it spicy? → phèt mái?',
      'can … ?': 'Can you speak Thai? → khun phûut phaa-sǎa thai dâay mái?',
      'have you ever … ?': 'Have you ever tried Pad Thai? → khun khəəy gin phàt-thai mái?'
    }
  };
})(window);