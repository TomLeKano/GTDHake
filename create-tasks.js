// Vercel Serverless Function — pont sécurisé entre GTDHack et Notion
// Le token Notion reste côté serveur (variable d'environnement), jamais exposé au navigateur.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return res.status(500).json({
      error: 'Configuration manquante: NOTION_TOKEN ou NOTION_DATABASE_ID absent des variables d\'environnement Vercel.'
    });
  }

  const { tasks } = req.body || {};
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Aucune tâche à envoyer.' });
  }

  const results = [];
  const errors = [];

  for (const task of tasks) {
    try {
      const properties = buildNotionProperties(task);
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: DATABASE_ID },
          properties
        })
      });

      const data = await response.json();

      if (!response.ok) {
        errors.push({ task: task.Titre, error: data.message || 'Erreur Notion inconnue' });
      } else {
        results.push(data.id);
      }
    } catch (err) {
      errors.push({ task: task.Titre, error: err.message });
    }
  }

  if (results.length === 0) {
    return res.status(502).json({ error: 'Aucune tâche créée.', details: errors });
  }

  return res.status(200).json({
    success: true,
    count: results.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}

function buildNotionProperties(task) {
  const props = {
    'Titre': { title: [{ text: { content: (task.Titre || 'Sans titre').substring(0, 2000) } }] },
    'Statut': { status: { name: 'Pas commencé' } }
  };

  if (task.Type) {
    props['Type'] = { select: { name: task.Type } };
  }

  if (task.Priorité) {
    props['Priorité'] = { select: { name: task.Priorité } };
  }

  if (Array.isArray(task.Catégorie) && task.Catégorie.length > 0) {
    props['Catégorie'] = { multi_select: task.Catégorie.map(c => ({ name: c })) };
  }

  if (task['Contexte/Raison']) {
    props['Contexte/Raison'] = { rich_text: [{ text: { content: task['Contexte/Raison'].substring(0, 2000) } }] };
  }

  if (task['Action à faire']) {
    props['Action à faire'] = { rich_text: [{ text: { content: task['Action à faire'].substring(0, 2000) } }] };
  }

  if (Array.isArray(task['Sous-éléments']) && task['Sous-éléments'].length > 0) {
    const joined = task['Sous-éléments'].filter(s => s && s.trim()).map(s => `• ${s}`).join('\n');
    if (joined) {
      props['Sous-éléments'] = { rich_text: [{ text: { content: joined.substring(0, 2000) } }] };
    }
  }

  if (task['Objet rangé']) {
    props['Objet rangé'] = { rich_text: [{ text: { content: task['Objet rangé'].substring(0, 2000) } }] };
  }

  if (task.Localisation) {
    props['Localisation'] = { rich_text: [{ text: { content: task.Localisation.substring(0, 2000) } }] };
  }

  if (task.Idée) {
    props['Idée'] = { rich_text: [{ text: { content: task.Idée.substring(0, 2000) } }] };
  }

  return props;
}
