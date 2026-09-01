
/*
|--------------------------------------------------------------------------
| VARIABLES
|--------------------------------------------------------------------------
*/

let reports = []

let generatedCount = 0

let currentPreviewType = null

const API_PREFIX =
    '/api/super-admin/reports'


/*
|--------------------------------------------------------------------------
| ÉLÉMENTS
|--------------------------------------------------------------------------
*/

const sidebar =
    document.getElementById(
        'sidebar'
    )

const sidebarOverlay =
    document.getElementById(
        'sidebarOverlay'
    )

const reportsGrid =
    document.getElementById(
        'reportsGrid'
    )

const emptyState =
    document.getElementById(
        'emptyState'
    )

const searchInput =
    document.getElementById(
        'searchInput'
    )

const typeFilter =
    document.getElementById(
        'typeFilter'
    )

const reportType =
    document.getElementById(
        'reportType'
    )


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

function getAccessToken() {

    return sessionStorage.getItem(
        'smart_school_access_token'
    )

}


function redirectToLogin() {

    sessionStorage.removeItem(
        'smart_school_access_token'
    )

    sessionStorage.removeItem(
        'smart_school_user'
    )

    window.location.replace('/')

}


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

async function apiRequest(
    url,
    options = {}
) {

    const token =
        getAccessToken()


    if (!token) {

        redirectToLogin()

        throw new Error(
            'Votre session a expiré.'
        )

    }


    const response =
        await fetch(
            url,
            {

                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        'application/json',

                },

            }
        )


    if (
        response.status ===
        401
    ) {

        redirectToLogin()

        throw new Error(
            'Votre session a expiré.'
        )

    }


    return response

}


/*
|--------------------------------------------------------------------------
| FORMATAGE
|--------------------------------------------------------------------------
*/

function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        'fr-FR'
    )

}


function escapeHtml(
    value
) {

    return String(
        value ?? ''
    )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        )

}


/*
|--------------------------------------------------------------------------
| MÉTADONNÉES UI
|--------------------------------------------------------------------------
*/

function reportVisual(
    type
) {

    const visuals = {

        schools: {
            icon:
                'fa-school',
            bg:
                'bg-sky-50',
            text:
                'text-sky-600',
            hover:
                'hover:border-sky-200',
            button:
                'text-sky-600',
        },

        users: {
            icon:
                'fa-users',
            bg:
                'bg-indigo-50',
            text:
                'text-indigo-600',
            hover:
                'hover:border-indigo-200',
            button:
                'text-indigo-600',
        },

        students: {
            icon:
                'fa-user-graduate',
            bg:
                'bg-emerald-50',
            text:
                'text-emerald-600',
            hover:
                'hover:border-emerald-200',
            button:
                'text-emerald-600',
        },

        platform: {
            icon:
                'fa-chart-column',
            bg:
                'bg-violet-50',
            text:
                'text-violet-600',
            hover:
                'hover:border-violet-200',
            button:
                'text-violet-600',
        },

    }


    return (
        visuals[type] ||
        visuals.platform
    )

}


/*
|--------------------------------------------------------------------------
| ERREUR
|--------------------------------------------------------------------------
*/

function showGlobalError(
    message
) {

    const box =
        document.getElementById(
            'reportsError'
        )

    const text =
        document.getElementById(
            'reportsErrorText'
        )


    text.textContent =
        message


    box.classList.remove(
        'hidden'
    )

    box.classList.add(
        'flex'
    )

}


function hideGlobalError() {

    const box =
        document.getElementById(
            'reportsError'
        )

    box.classList.add(
        'hidden'
    )

    box.classList.remove(
        'flex'
    )

}


/*
|--------------------------------------------------------------------------
| CHARGEMENT
|--------------------------------------------------------------------------
*/

async function loadReports() {

    hideGlobalError()


    const loading =
        document.getElementById(
            'reportsLoading'
        )


    loading.classList.remove(
        'hidden'
    )


    try {

        const response =
            await apiRequest(
                API_PREFIX
            )


        const result =
            await response.json()


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de récupérer les rapports.'
            )

        }


        reports =
            Array.isArray(
                result.data
            )
                ? result.data
                : []


        renderTypeFilters()

        renderReportCards()

        updateSummary()

    } catch (
        error
    ) {

        console.error(
            'Reports:',
            error
        )


        showGlobalError(
            error.message ||
            'Impossible de récupérer les rapports.'
        )

    } finally {

        loading.classList.add(
            'hidden'
        )

    }

}


/*
|--------------------------------------------------------------------------
| FILTRES
|--------------------------------------------------------------------------
*/

function renderTypeFilters() {

    const currentFilter =
        typeFilter.value


    const currentReportType =
        reportType.value


    typeFilter.innerHTML =
        `
            <option value="">
                Tous les types
            </option>
        `


    reportType.innerHTML =
        `
            <option value="">
                Sélectionner un rapport
            </option>
        `


    reports.forEach(
        report => {

            const option =
                document.createElement(
                    'option'
                )

            option.value =
                report.type

            option.textContent =
                report.name

            reportType.appendChild(
                option
            )

        }
    )


    const uniqueTypes =
        [
            ...new Map(
                reports.map(
                    report => [
                        report.type,
                        report.name
                    ]
                )
            )
        ]


    uniqueTypes.forEach(
        ([type, name]) => {

            const option =
                document.createElement(
                    'option'
                )

            option.value =
                type

            option.textContent =
                name

            typeFilter.appendChild(
                option
            )

        }
    )


    if (
        reports.some(
            report =>
                report.type ===
                currentFilter
        )
    ) {

        typeFilter.value =
            currentFilter

    }


    if (
        reports.some(
            report =>
                report.type ===
                currentReportType
        )
    ) {

        reportType.value =
            currentReportType

    }

}


/*
|--------------------------------------------------------------------------
| CARDS
|--------------------------------------------------------------------------
*/

function renderReportCards() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase()


    const selectedType =
        typeFilter.value


    const filtered =
        reports.filter(
            report => {

                const matchesSearch =
                    !search ||
                    report.name
                        .toLowerCase()
                        .includes(search) ||
                    report.description
                        .toLowerCase()
                        .includes(search)


                const matchesType =
                    !selectedType ||
                    report.type === selectedType


                return (
                    matchesSearch &&
                    matchesType
                )

            }
        )


    reportsGrid.innerHTML =
        ''


    document
        .getElementById(
            'filteredCount'
        )
        .textContent =
        `${filtered.length} ${
            filtered.length > 1
                ? 'rapports'
                : 'rapport'
        }`


    if (
        filtered.length === 0
    ) {

        emptyState.classList.remove(
            'hidden'
        )

        return

    }


    emptyState.classList.add(
        'hidden'
    )


    filtered.forEach(
        report => {

            const visual =
                reportVisual(
                    report.type
                )


            const card =
                document.createElement(
                    'article'
                )


            card.className =
                `
                    report-card
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    shadow-sm
                    ${visual.hover}
                `


            card.innerHTML =
                `
                    <div
                        class="
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-xl
                            ${visual.bg}
                            ${visual.text}
                        "
                    >
                        <i
                            class="
                                fa-solid
                                ${visual.icon}
                                text-lg
                            "
                        ></i>
                    </div>

                    <h3
                        class="
                            mt-5
                            font-bold
                            text-slate-900
                        "
                    >
                        ${escapeHtml(
                            report.name
                        )}
                    </h3>

                    <p
                        class="
                            mt-2
                            min-h-[72px]
                            text-sm
                            leading-6
                            text-slate-400
                        "
                    >
                        ${escapeHtml(
                            report.description
                        )}
                    </p>

                    <div
                        class="
                            mt-5
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <span
                            class="
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                bg-slate-100
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-slate-600
                            "
                        >
                            <i class="fa-solid fa-file-csv"></i>
                            CSV
                        </span>


                        <span
                            class="
                                text-xs
                                text-slate-400
                            "
                        >
                            ${escapeHtml(
                                report.type
                            )}
                        </span>

                    </div>


                    <div
                        class="
                            mt-5
                            grid
                            grid-cols-2
                            gap-2
                        "
                    >

                        <button
                            type="button"
                            class="
                                action-button
                                rounded-xl
                                border
                                border-slate-200
                                px-3
                                py-2.5
                                text-xs
                                font-semibold
                                text-slate-600
                                hover:bg-slate-50
                            "
                            data-preview-type="${escapeHtml(
                                report.type
                            )}"
                        >
                            <i
                                class="
                                    fa-regular
                                    fa-eye
                                    mr-1
                                "
                            ></i>
                            Aperçu
                        </button>


                        <button
                            type="button"
                            class="
                                action-button
                                rounded-xl
                                bg-primary-600
                                px-3
                                py-2.5
                                text-xs
                                font-semibold
                                text-white
                                hover:bg-primary-700
                            "
                            data-download-type="${escapeHtml(
                                report.type
                            )}"
                        >
                            <i
                                class="
                                    fa-solid
                                    fa-download
                                    mr-1
                                "
                            ></i>
                            Télécharger
                        </button>

                    </div>


                    <button
                        type="button"
                        class="
                            mt-2
                            w-full
                            rounded-xl
                            border
                            border-primary-100
                            bg-primary-50
                            px-3
                            py-2.5
                            text-xs
                            font-semibold
                            text-primary-700
                            hover:bg-primary-100
                        "
                        data-generate-type="${escapeHtml(
                            report.type
                        )}"
                    >
                        <i
                            class="
                                fa-solid
                                fa-file-circle-plus
                                mr-1
                            "
                        ></i>
                        Générer maintenant
                    </button>
                `


            reportsGrid.appendChild(
                card
            )

        }
    )


    bindCardActions()

}


/*
|--------------------------------------------------------------------------
| ACTIONS DES CARTES
|--------------------------------------------------------------------------
*/

function bindCardActions() {

    document
        .querySelectorAll(
            '[data-preview-type]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        previewReport(
                            button.dataset.previewType
                        )

                    }
                )

            }
        )


    document
        .querySelectorAll(
            '[data-download-type]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        downloadReport(
                            button.dataset.downloadType
                        )

                    }
                )

            }
        )


    document
        .querySelectorAll(
            '[data-generate-type]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openGenerateModal(
                            button.dataset.generateType
                        )

                    }
                )

            }
        )

}


/*
|--------------------------------------------------------------------------
| RÉSUMÉ
|--------------------------------------------------------------------------
*/

function updateSummary() {

    document
        .getElementById(
            'totalReportTypes'
        )
        .textContent =
        formatNumber(
            reports.length
        )


    document
        .getElementById(
            'generatedCount'
        )
        .textContent =
        formatNumber(
            generatedCount
        )

}


/*
|--------------------------------------------------------------------------
| MODAL GÉNÉRATION
|--------------------------------------------------------------------------
*/

const generateModal =
    document.getElementById(
        'generateModal'
    )


const generateModalContent =
    document.getElementById(
        'generateModalContent'
    )


function openGenerateModal(
    presetType = ''
) {

    document
        .getElementById(
            'generateError'
        )
        .classList.add(
            'hidden'
        )


    generateModal.classList.remove(
        'hidden'
    )

    generateModal.classList.add(
        'flex'
    )


    if (
        presetType
    ) {

        reportType.value =
            presetType

    }


    setTimeout(
        () => {

            generateModal.classList.remove(
                'opacity-0'
            )

            generateModalContent.classList.remove(
                'scale-95'
            )

            generateModalContent.classList.add(
                'scale-100'
            )

        },
        10
    )

}


function closeGenerateModal() {

    generateModal.classList.add(
        'opacity-0'
    )

    generateModalContent.classList.remove(
        'scale-100'
    )

    generateModalContent.classList.add(
        'scale-95'
    )


    setTimeout(
        () => {

            generateModal.classList.remove(
                'flex'
            )

            generateModal.classList.add(
                'hidden'
            )

        },
        200
    )

}


/*
|--------------------------------------------------------------------------
| GÉNÉRER
|--------------------------------------------------------------------------
*/

async function generateReport(
    event
) {

    event.preventDefault()


    const type =
        reportType.value


    if (!type) {

        return

    }


    const button =
        document.getElementById(
            'generateButton'
        )


    const buttonIcon =
        document.getElementById(
            'generateButtonIcon'
        )


    const buttonText =
        document.getElementById(
            'generateButtonText'
        )


    const errorElement =
        document.getElementById(
            'generateError'
        )


    button.disabled =
        true


    buttonIcon.className =
        'fa-solid fa-spinner fa-spin'


    buttonText.textContent =
        'Génération...'


    errorElement.classList.add(
        'hidden'
    )


    try {

        const response =
            await apiRequest(
                API_PREFIX,
                {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                    },

                    body:
                        JSON.stringify({
                            type,
                        }),

                }
            )


        const result =
            await response.json()


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de générer le rapport.'
            )

        }


        generatedCount++


        updateSummary()


        const now =
            new Date()


        document
            .getElementById(
                'lastGeneratedInfo'
            )
            .textContent =
            `Dernière génération : ${
                now.toLocaleTimeString(
                    'fr-FR'
                )
            }`


        closeGenerateModal()


        showToast(
            result.message ||
            'Rapport généré avec succès.'
        )


        await downloadReport(
            type
        )

    } catch (
        error
    ) {

        console.error(
            'Generate report:',
            error
        )


        errorElement.textContent =
            error.message


        errorElement.classList.remove(
            'hidden'
        )

    } finally {

        button.disabled =
            false

        buttonIcon.className =
            'fa-solid fa-file-circle-plus'

        buttonText.textContent =
            'Générer'

    }

}


/*
|--------------------------------------------------------------------------
| TÉLÉCHARGER
|--------------------------------------------------------------------------
*/

async function downloadReport(
    type
) {

    try {

        const token =
            getAccessToken()


        if (!token) {

            redirectToLogin()

            return

        }


        const response =
            await fetch(
                `${API_PREFIX}/${encodeURIComponent(type)}/download`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'text/csv',

                    },

                }
            )


        if (
            response.status ===
            401
        ) {

            redirectToLogin()

            return

        }


        if (!response.ok) {

            let message =
                'Impossible de télécharger le rapport.'


            try {

                const error =
                    await response.json()


                if (
                    error?.message
                ) {

                    message =
                        error.message

                }

            } catch {
                // réponse non JSON
            }


            throw new Error(
                message
            )

        }


        const blob =
            await response.blob()


        const filename =
            `smart-school-${type}.csv`


        const url =
            URL.createObjectURL(
                blob
            )


        const link =
            document.createElement(
                'a'
            )


        link.href =
            url

        link.download =
            filename

        document
            .body
            .appendChild(
                link
            )


        link.click()

        link.remove()


        URL.revokeObjectURL(
            url
        )


        showToast(
            'Téléchargement du rapport terminé.'
        )

    } catch (
        error
    ) {

        console.error(
            'Download report:',
            error
        )


        showGlobalError(
            error.message
        )

    }

}


/*
|--------------------------------------------------------------------------
| APERÇU
|--------------------------------------------------------------------------
*/

const previewModal =
    document.getElementById(
        'previewModal'
    )


const previewModalContent =
    document.getElementById(
        'previewModalContent'
    )


async function previewReport(
    type
) {

    currentPreviewType =
        type


    const report =
        reports.find(
            item =>
                item.type ===
                type
        )


    document
        .getElementById(
            'previewTitle'
        )
        .textContent =
        report?.name ||
        'Prévisualisation'


    document
        .getElementById(
            'previewSubtitle'
        )
        .textContent =
        report?.description ||
        'Contenu du rapport'


    const loading =
        document.getElementById(
            'previewLoading'
        )


    const errorElement =
        document.getElementById(
            'previewError'
        )


    const content =
        document.getElementById(
            'previewContent'
        )


    const csv =
        document.getElementById(
            'previewCsv'
        )


    loading.classList.remove(
        'hidden'
    )


    errorElement.classList.add(
        'hidden'
    )


    content.classList.add(
        'hidden'
    )


    csv.textContent =
        ''


    previewModal.classList.remove(
        'hidden'
    )

    previewModal.classList.add(
        'flex'
    )


    setTimeout(
        () => {

            previewModal.classList.remove(
                'opacity-0'
            )

            previewModalContent.classList.remove(
                'scale-95'
            )

            previewModalContent.classList.add(
                'scale-100'
            )

        },
        10
    )


    try {

        const token =
            getAccessToken()


        if (!token) {

            redirectToLogin()

            return

        }


        const response =
            await fetch(
                `${API_PREFIX}/${encodeURIComponent(type)}/download`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'text/csv',

                    },

                }
            )


        if (
            response.status ===
            401
        ) {

            redirectToLogin()

            return

        }


        if (!response.ok) {

            throw new Error(
                'Impossible de récupérer l’aperçu du rapport.'
            )

        }


        let text =
            await response.text()


        /*
         * Le backend ajoute un BOM UTF-8.
         * On le supprime pour l'affichage.
         */

        text =
            text.replace(
                /^\uFEFF/,
                ''
            )


        /*
         * Afficher seulement un extrait pour
         * éviter un navigateur surchargé.
         */

        const lines =
            text
                .split('\n')
                .slice(
                    0,
                    80
                )


        csv.textContent =
            lines.join('\n')


        if (
            text.split('\n').length >
            80
        ) {

            csv.textContent +=
                '\n\n... aperçu limité aux 80 premières lignes ...'

        }


        content.classList.remove(
            'hidden'
        )

    } catch (
        error
    ) {

        console.error(
            'Preview report:',
            error
        )


        errorElement.textContent =
            error.message


        errorElement.classList.remove(
            'hidden'
        )

    } finally {

        loading.classList.add(
            'hidden'
        )

    }

}


/*
|--------------------------------------------------------------------------
| FERMER APERÇU
|--------------------------------------------------------------------------
*/

function closePreviewModal() {

    previewModal.classList.add(
        'opacity-0'
    )

    previewModalContent.classList.remove(
        'scale-100'
    )

    previewModalContent.classList.add(
        'scale-95'
    )


    setTimeout(
        () => {

            previewModal.classList.remove(
                'flex'
            )

            previewModal.classList.add(
                'hidden'
            )

        },
        200
    )

}


/*
|--------------------------------------------------------------------------
| RECHERCHE / FILTRE
|--------------------------------------------------------------------------
*/

searchInput.addEventListener(
    'input',
    renderReportCards
)


typeFilter.addEventListener(
    'change',
    renderReportCards
)


/*
|--------------------------------------------------------------------------
| ACTUALISATION
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        'refreshReports'
    )
    .addEventListener(
        'click',
        loadReports
    )


/*
|--------------------------------------------------------------------------
| SIDEBAR MOBILE
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        'openSidebar'
    )
    ?.addEventListener(
        'click',
        () => {

            sidebar.classList.remove(
                '-translate-x-full'
            )

            sidebarOverlay.classList.remove(
                'hidden'
            )

        }
    )


document
    .getElementById(
        'closeSidebar'
    )
    ?.addEventListener(
        'click',
        hideSidebar
    )


sidebarOverlay
    ?.addEventListener(
        'click',
        hideSidebar
    )


function hideSidebar() {

    sidebar.classList.add(
        '-translate-x-full'
    )

    sidebarOverlay.classList.add(
        'hidden'
    )

}


/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/

function showToast(
    message
) {

    const existing =
        document.getElementById(
            'smartSchoolToast'
        )


    existing?.remove()


    const toast =
        document.createElement(
            'div'
        )


    toast.id =
        'smartSchoolToast'


    toast.className =
        `
            fixed
            bottom-5
            right-5
            z-[200]
            flex
            max-w-sm
            items-center
            gap-3
            rounded-2xl
            border
            border-emerald-200
            bg-white
            px-4
            py-3
            text-sm
            font-medium
            text-slate-700
            shadow-2xl
        `


    toast.innerHTML =
        `
            <div
                class="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    bg-emerald-50
                    text-emerald-600
                "
            >
                <i
                    class="
                        fa-solid
                        fa-circle-check
                    "
                ></i>
            </div>

            <span>
                ${escapeHtml(
                    message
                )}
            </span>
        `


    document.body.appendChild(
        toast
    )


    setTimeout(
        () => {

            toast.remove()

        },
        3000
    )

}


/*
|--------------------------------------------------------------------------
| ESCAPE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key ===
            'Escape'
        ) {

            closeGenerateModal()

            closePreviewModal()

            hideSidebar()

        }

    }
)


/*
|--------------------------------------------------------------------------
| CLICK OUTSIDE MODALS
|--------------------------------------------------------------------------
*/

generateModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            generateModal
        ) {

            closeGenerateModal()

        }

    }
)


previewModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            previewModal
        ) {

            closePreviewModal()

        }

    }
)


/*
|--------------------------------------------------------------------------
| TÉLÉCHARGEMENT DEPUIS APERÇU
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        'previewDownloadButton'
    )
    .addEventListener(
        'click',
        () => {

            if (
                currentPreviewType
            ) {

                downloadReport(
                    currentPreviewType
                )

            }

        }
    )


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function logout() {

    const confirmed =
        window.confirm(
            'Voulez-vous vraiment vous déconnecter ?'
        )


    if (!confirmed) {

        return

    }


    const token =
        getAccessToken()


    try {

        if (token) {

            await fetch(
                '/api/auth/logout',
                {

                    method:
                        'POST',

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        Accept:
                            'application/json',

                    },

                }
            )

        }

    } catch (
        error
    ) {

        console.error(
            'Logout:',
            error
        )

    } finally {

        sessionStorage.removeItem(
            'smart_school_access_token'
        )

        sessionStorage.removeItem(
            'smart_school_user'
        )

        window.location.replace(
            '/'
        )

    }

}


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await loadReports()

    }
)
