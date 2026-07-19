import env from '#start/env'

export default class GrokService {

private apiUrl = 'https://api.groq.com/openai/v1/chat/completions' // env.get('GROQ_API_URL')
private apiKey = env.get('GROQ_API_KEY')


private isChatCompletionResponse(
  data: unknown
): data is { choices: Array<{ message: { content: string } }> } {
  if (!data || typeof data !== 'object') return false
  const maybe = data as { choices?: unknown }
  if (!Array.isArray(maybe.choices) || maybe.choices.length === 0) return false

  const first = maybe.choices[0] as unknown
  if (!first || typeof first !== 'object') return false

  const maybeFirst = first as { message?: unknown }
  if (!maybeFirst.message || typeof maybeFirst.message !== 'object') return false

  const maybeMessage = maybeFirst.message as { content?: unknown }
  return typeof maybeMessage.content === 'string'
}

private async callAPI(systemPrompt: string, userPrompt: string) {
  try {
    const body = {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }

    console.log('Body envoyé :', body)

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      console.error('Erreur API (status):', response.status, response.statusText)
      const errorData = await response.json()
      console.error('Détails de l’erreur 400 :', JSON.stringify(errorData, null, 2))
      return "Désolé, l'IA est actuellement indisponible."
    }

    const data: unknown = await response.json()
    if (!this.isChatCompletionResponse(data)) {
      console.error('Erreur API (payload inattendu):', data)
      return "Désolé, l'IA est actuellement indisponible."
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('Erreur API:', error)
    return "Désolé, l'IA est actuellement indisponible."
  }
}

  // Générer du contenu
  async generateTweet(topic: string) {
    const system = "Tu es Grok, l'IA de NovaTech. Ton but est de rédiger un tweet engageant, drôle ou informatif, de moins de 280 caractères."
    return await this.callAPI(system, `Rédige un tweet sur le sujet suivant : ${topic}`)
  }

  //  Suggérer des hashtags
  async suggestHashtags(content: string) {
    const system = "Tu es un expert en réseaux sociaux. Renvoie UNIQUEMENT une liste de 3 à 5 hashtags pertinents basés sur le texte fourni, séparés par des espaces."
    return await this.callAPI(system, `Texte : ${content}`)
  }

  // Analyser les tweets de l'utilisateur
  async analyzeProfile(tweets: any[]) {
    const system = `Tu es Grok, l'analyste stratégique de NovaTech.
    Ton rôle est de fournir un "Audit de Performance" court et piquant.
    Structure ta réponse avec :
    1. Un titre style 'Diagnostic Flash'.
    2. Une observation sur l'engagement basée sur les chiffres fournis.
    3. Un conseil concret pour percer sur le réseau.`

    const prompt = tweets.map((t, i) =>
      `Post ${i+1}: "${t.content}" | Stats: ${t.stats} | Date: ${t.date}`
    ).join('\n')

    return await this.callAPI(system, `Analyse mes performances :\n${prompt}`)
  }
}
