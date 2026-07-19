          const input = document.getElementById('medias-input');
          const container = document.getElementById('preview-container');

          input.addEventListener('change', function() {
            // On vide le container à chaque nouvelle sélection
            container.innerHTML = '';

            if (this.files) {
              Array.from(this.files).forEach(file => {
                const reader = new FileReader();

                reader.onload = function(e) {
                  // Création de la div de preview
                  const div = document.createElement('div');
                  div.className = "relative group";

                  div.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-32 object-cover rounded-xl border border-gray-700">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                      <span class="text-white text-xs font-bold">${(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  `;

                  container.appendChild(div);
                }

                reader.readAsDataURL(file);
              });
            }
          });

// ==============================================================
// GROK IA
// =====================

  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  //const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  const textarea = document.getElementById('tweetContent');
  const statusDiv = document.getElementById('grokStatus');

  // Helper pour gérer l'UI pendant l'appel
  function toggleGrokLoading(isLoading) {
    statusDiv.classList.toggle('hidden', !isLoading);
    document.getElementById('btnGrokGen').disabled = isLoading;
    document.getElementById('btnGrokHash').disabled = isLoading;
    if (isLoading) textarea.classList.add('opacity-50');
    else textarea.classList.remove('opacity-50');
  }

  async function askGrokToGenerate() {
    const topic = prompt("Grok : Sur quel sujet dois-je écrire ?");
    if (!topic) return;

    toggleGrokLoading(true);

    try {
      const response = await fetch('/ai/grok/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ topic })
      });

      const data = await response.json();
      textarea.value = data.text;
    } catch (error) {
      alert("Erreur : Grok est indisponible pour le moment.");
    } finally {
      toggleGrokLoading(false);
    }
  }

  async function askGrokForHashtags() {
    // const Hashtag = prompt("Grok : Quel Hashtag ?");
    if (!textarea.value || textarea.value.trim().length < 5) {
      alert("Écris d'abord un texte plus long pour que Grok puisse l'analyser !");
      return;
    }

    toggleGrokLoading(true);

    try {
      const response = await fetch('/ai/grok/hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ content: textarea.value })
      });

      const data = await response.json();
      // On ajoute les hashtags proprement à la ligne
      textarea.value = textarea.value.trim() + '\n\n' + data.hashtags;
    } catch (error) {
      console.log(error)
      alert("Erreur lors de la récupération des hashtags.");
    } finally {
      toggleGrokLoading(false);
    }
  }


  async function runProfileAnalysis() {
    const contentDiv = document.getElementById('grokAnalysisContent');
    const modal = document.getElementById('grokModal');

    // Afficher la modale avec un loader
    modal.classList.remove('hidden');
    contentDiv.innerHTML = "Grok épluche vos données... 🔍";

    try {
      const response = await fetch('/ai/grok/analyze');
      const data = await response.json();

      // On affiche le résultat
      contentDiv.innerHTML = data.analysis;
    } catch (error) {
      contentDiv.innerHTML = "Une erreur est survenue avec Grok. Réessayez ?";
    }
  }

  function closeGrokModal() {
    document.getElementById('grokModal').classList.add('hidden');
  }


