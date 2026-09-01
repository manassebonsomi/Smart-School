(function () {

    'use strict'


    /*
    |--------------------------------------------------------------------------
    | CONFIGURATION
    |--------------------------------------------------------------------------
    */

    const TOKEN_KEY =
        'smart_school_access_token'


    let statisticsData =
        null


    let registrationChart =
        null


    let schoolStatusChart =
        null


    let usersChart =
        null


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    function getToken() {

        return sessionStorage.getItem(
            TOKEN_KEY
        )

    }


    function formatNumber(
        value
    ) {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(
            Number(value || 0)
        )

    }


    function formatDate(
        value
    ) {

        if (!value) {

            return 'Date inconnue'

        }


        const date =
            new Date(value)


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return 'Date inconnue'

        }


        return new Intl.DateTimeFormat(
            'fr-FR',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        ).format(
            date
        )

    }


    function timeAgo(
        value
    ) {

        if (!value) {
            return '—'
        }


        const date =
            new Date(value)


        const difference =
            Date.now() -
            date.getTime()


        const minutes =
            Math.floor(
                difference /
                60000
            )


        if (
            minutes < 1
        ) {

            return 'À l’instant'

        }


        if (
            minutes < 60
        ) {

            return `Il y a ${minutes} min`

        }


        const hours =
            Math.floor(
                minutes / 60
            )


        if (
            hours < 24
        ) {

            return `Il y a ${hours} h`

        }


        const days =
            Math.floor(
                hours / 24
            )


        if (
            days < 7
        ) {

            return `Il y a ${days} j`

        }


        return formatDate(
            value
        )

    }


    function escapeHtml(
        value
    ) {

        const element =
            document.createElement(
                'div'
            )


        element.textContent =
            value ?? ''


        return element.innerHTML

    }


    function showError(
        message
    ) {

        const element =
            document.getElementById(
                'statisticsError'
            )


        if (!element) {
            return
        }


        element.textContent =
            message


        element.classList.remove(
            'hidden'
        )

    }


    function hideError() {

        document
            .getElementById(
                'statisticsError'
            )
            ?.classList.add(
                'hidden'
            )

    }


    function showLoading(
        visible
    ) {

        document
            .getElementById(
                'statisticsLoading'
            )
            ?.classList.toggle(
                'hidden',
                !visible
            )

    }


    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    async function apiRequest(
        url
    ) {

        const token =
            getToken()


        if (!token) {

            window.location.replace('/')

            throw new Error(
                'Session expirée.'
            )

        }


        const response =
            await fetch(
                url,
                {

                    headers: {

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

            sessionStorage.clear()

            window.location.replace('/')

            throw new Error(
                'Session expirée.'
            )

        }


        if (
            response.status ===
            403
        ) {

            throw new Error(
                'Accès réservé au super administrateur.'
            )

        }


        return response

    }


    async function fetchStatistics(
        months
    ) {

        const response =
            await apiRequest(
                `/api/super-admin/statistiques?months=${months}`
            )


        const result =
            await response
                .json()
                .catch(
                    () => null
                )


        if (
            !response.ok ||
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                'Impossible de charger les statistiques.'
            )

        }


        return result.data

    }


    /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

    function renderOverview(overview) {
const fields = {

    schoolsCount:
        overview.totalSchools,

    studentsCount:
        overview.students,

    usersCount:
        overview.totalUsers,

    administratorsCount:
        overview.administrators,

    activeSchoolsInfo:
        `${formatNumber(
            overview.activeSchools
        )} actives`,

    suspendedSchoolsInfo:
        `${formatNumber(
            overview.suspendedSchools
        )} suspendues`,

    activeUsersInfo:
        `${formatNumber(
            overview.activeUsers
        )} comptes actifs`,

    activeRateInfo:
        `${overview.activeUserRate}% actifs`

}


Object.entries(fields).forEach(
    ([id, value]) => {

        const element =
            document.getElementById(id)


        if (!element) {

            console.warn(
                `Statistiques : l'élément #${id} est absent de la vue.`
            )

            return

        }


        element.textContent =
            value

    }
)


}



    /*
    |--------------------------------------------------------------------------
    | SCHOOL STATUS CHART
    |--------------------------------------------------------------------------
    */

    function renderSchoolStatus(
        data
    ) {

        const ctx =
            document.getElementById(
                'schoolStatusChart'
            )


        if (!ctx) {
            return
        }


        if (
            schoolStatusChart
        ) {

            schoolStatusChart.destroy()

        }


        schoolStatusChart =
            new Chart(
                ctx,
                {

                    type:
                        'doughnut',

                    data: {

                        labels:
                            data.labels,

                        datasets: [

                            {

                                data:
                                    data.values,

                                backgroundColor: [

                                    '#38BDF8',

                                    '#FBBF24',

                                    '#94A3B8',

                                ],

                                borderWidth:
                                    0,

                            },

                        ],

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '72%',

                        plugins: {

                            legend: {

                                display:
                                    false,

                            },

                        },

                    },

                }
            )


        document
            .getElementById(
                'activeSchoolsCount'
            )
            .textContent =
            formatNumber(
                data.details.actives
            )


        document
            .getElementById(
                'suspendedSchoolsCount'
            )
            .textContent =
            formatNumber(
                data.details.suspendues
            )


        document
            .getElementById(
                'archivedSchoolsCount'
            )
            .textContent =
            formatNumber(
                data.details.archivees
            )

    }


    /*
    |--------------------------------------------------------------------------
    | USERS CHART
    |--------------------------------------------------------------------------
    */

    function renderUsers(
        data
    ) {

        const ctx =
            document.getElementById(
                'usersChart'
            )


        if (!ctx) {
            return
        }


        if (
            usersChart
        ) {

            usersChart.destroy()

        }


        usersChart =
            new Chart(
                ctx,
                {

                    type:
                        'bar',

                    data: {

                        labels:
                            data.labels,

                        datasets: [

                            {

                                label:
                                    'Utilisateurs',

                                data:
                                    data.values,

                                backgroundColor: [

                                    '#38BDF8',

                                    '#818CF8',

                                    '#FBBF24',

                                    '#34D399',

                                ],

                                borderRadius:
                                    8,

                                borderSkipped:
                                    false,

                            },

                        ],

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    false,

                            },

                        },

                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                grid: {

                                    color:
                                        '#F1F5F9',

                                },

                                border: {

                                    display:
                                        false,

                                },

                            },

                            x: {

                                grid: {

                                    display:
                                        false,

                                },

                                border: {

                                    display:
                                        false,

                                },

                            },

                        },

                    },

                }
            )


        document
            .getElementById(
                'studentsRoleCount'
            )
            .textContent =
            formatNumber(
                data.details.students
            )


        document
            .getElementById(
                'teachersRoleCount'
            )
            .textContent =
            formatNumber(
                data.details.teachers
            )


        document
            .getElementById(
                'parentsRoleCount'
            )
            .textContent =
            formatNumber(
                data.details.parents
            )


        document
            .getElementById(
                'adminsRoleCount'
            )
            .textContent =
            formatNumber(
                data.details.administrators
            )

    }


    /*
    |--------------------------------------------------------------------------
    | MONTHLY CHART
    |--------------------------------------------------------------------------
    */

    function renderMonthly(
        data
    ) {

        const ctx =
            document.getElementById(
                'registrationChart'
            )


        if (!ctx) {
            return
        }


        if (
            registrationChart
        ) {

            registrationChart.destroy()

        }


        registrationChart =
            new Chart(
                ctx,
                {

                    type:
                        'line',

                    data: {

                        labels:
                            data.labels,

                        datasets: [

                            {

                                label:
                                    'Écoles',

                                data:
                                    data.schools,

                                borderColor:
                                    '#38BDF8',

                                backgroundColor:
                                    'rgba(56,189,248,0.10)',

                                borderWidth:
                                    3,

                                fill:
                                    true,

                                tension:
                                    0.4,

                                pointRadius:
                                    3,

                            },

                            {

                                label:
                                    'Utilisateurs',

                                data:
                                    data.users,

                                borderColor:
                                    '#818CF8',

                                backgroundColor:
                                    'rgba(129,140,248,0.04)',

                                borderWidth:
                                    2,

                                fill:
                                    false,

                                tension:
                                    0.4,

                                pointRadius:
                                    3,

                            },

                            {

                                label:
                                    'Administrateurs',

                                data:
                                    data.administrators,

                                borderColor:
                                    '#34D399',

                                backgroundColor:
                                    'transparent',

                                borderWidth:
                                    2,

                                fill:
                                    false,

                                tension:
                                    0.4,

                                pointRadius:
                                    3,

                            },

                        ],

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            intersect:
                                false,

                            mode:
                                'index',

                        },

                        plugins: {

                            legend: {

                                display:
                                    false,

                            },

                        },

                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                grid: {

                                    color:
                                        '#F1F5F9',

                                },

                                border: {

                                    display:
                                        false,

                                },

                            },

                            x: {

                                grid: {

                                    display:
                                        false,

                                },

                                border: {

                                    display:
                                        false,

                                },

                            },

                        },

                    },

                }
            )

    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVITIES
    |--------------------------------------------------------------------------
    */

    function renderActivities(
        activities
    ) {

        const container =
            document.getElementById(
                'activityList'
            )


        if (!container) {
            return
        }


        if (
            !activities.length
        ) {

            container.innerHTML = `

                <div
                    class="
                        px-6
                        py-12
                        text-center
                        text-sm
                        text-slate-400
                    "
                >
                    Aucune activité récente.
                </div>

            `

            return

        }


        container.innerHTML =
            activities
                .map(
                    activity => `

                        <div
                            class="
                                flex
                                items-center
                                gap-4
                                border-b
                                border-slate-100
                                p-5
                                last:border-b-0
                            "
                        >

                            <div
                                class="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    ${activity.iconClass}
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        ${activity.icon}
                                    "
                                ></i>

                            </div>


                            <div class="min-w-0 flex-1">

                                <p
                                    class="
                                        truncate
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                                >
                                    ${escapeHtml(
                                        activity.title
                                    )}
                                </p>


                                <p
                                    class="
                                        mt-1
                                        truncate
                                        text-xs
                                        text-slate-400
                                    "
                                >
                                    ${escapeHtml(
                                        activity.description ||
                                        ''
                                    )}
                                </p>

                            </div>


                            <span
                                class="
                                    shrink-0
                                    text-xs
                                    text-slate-400
                                "
                            >
                                ${timeAgo(
                                    activity.date
                                )}
                            </span>

                        </div>

                    `
                )
                .join('')

    }


    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    async function loadStatistics() {

        hideError()

        showLoading(
            true
        )


        try {

            const period =
                Number(
                    document
                        .getElementById(
                            'periodFilter'
                        )
                        .value
                )


            statisticsData =
                await fetchStatistics(
                    period
                )


            renderOverview(
                statisticsData.overview
            )


            renderSchoolStatus(
                statisticsData.schoolStatus
            )


            renderUsers(
                statisticsData.usersByRole
            )


            renderMonthly(
                statisticsData.monthly
            )


            renderActivities(
                statisticsData.activities
            )


        } catch (
            error
        ) {

            console.error(
                'Statistiques:',
                error
            )


            showError(
                error.message ||
                'Impossible de charger les statistiques.'
            )

        } finally {

            showLoading(
                false
            )

        }

    }


    /*
    |--------------------------------------------------------------------------
    | EXPORT CSV
    |--------------------------------------------------------------------------
    */

    function exportStatistics() {

        if (
            !statisticsData
        ) {

            return

        }


        const rows = [

            [
                'Indicateur',
                'Valeur',
            ],

            [
                'Écoles',
                statisticsData.overview.totalSchools,
            ],

            [
                'Écoles actives',
                statisticsData.overview.activeSchools,
            ],

            [
                'Écoles suspendues',
                statisticsData.overview.suspendedSchools,
            ],

            [
                'Écoles archivées',
                statisticsData.overview.archivedSchools,
            ],

            [
                'Utilisateurs',
                statisticsData.overview.totalUsers,
            ],

            [
                'Utilisateurs actifs',
                statisticsData.overview.activeUsers,
            ],

            [
                'Élèves',
                statisticsData.overview.students,
            ],

            [
                'Administrateurs',
                statisticsData.overview.administrators,
            ],

        ]


        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                value =>
                                    `"${String(value).replace(
                                        /"/g,
                                        '""'
                                    )}"`
                            )
                            .join(';')
                )
                .join('\n')


        const blob =
            new Blob(
                [
                    '\uFEFF' +
                    csv,
                ],
                {
                    type:
                        'text/csv;charset=utf-8;',
                }
            )


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
            `smart-school-statistiques-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`


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

    }


    window.exportStatistics =
        exportStatistics


    /*
    |--------------------------------------------------------------------------
    | SIDEBAR
    |--------------------------------------------------------------------------
    */

    function initSidebar() {

        const sidebar =
            document.getElementById(
                'sidebar'
            )


        const overlay =
            document.getElementById(
                'sidebarOverlay'
            )


        const openButton =
            document.getElementById(
                'openSidebar'
            )


        const closeButton =
            document.getElementById(
                'closeSidebar'
            )


        function show() {

            sidebar
                ?.classList
                .remove(
                    '-translate-x-full'
                )

            overlay
                ?.classList
                .remove(
                    'hidden'
                )

        }


        function hide() {

            sidebar
                ?.classList
                .add(
                    '-translate-x-full'
                )

            overlay
                ?.classList
                .add(
                    'hidden'
                )

        }


        openButton
            ?.addEventListener(
                'click',
                show
            )


        closeButton
            ?.addEventListener(
                'click',
                hide
            )


        overlay
            ?.addEventListener(
                'click',
                hide
            )

    }


    /*
    |--------------------------------------------------------------------------
    | INIT
    |--------------------------------------------------------------------------
    */

    document.addEventListener(
        'DOMContentLoaded',
        () => {

            Chart.defaults.font.family =
                'Inter, ui-sans-serif, system-ui, sans-serif'


            Chart.defaults.color =
                '#64748B'


            initSidebar()


            document
                .getElementById(
                    'periodFilter'
                )
                ?.addEventListener(
                    'change',
                    loadStatistics
                )


            document
                .getElementById(
                    'refreshStatistics'
                )
                ?.addEventListener(
                    'click',
                    loadStatistics
                )


            loadStatistics()

        }
    )


})()