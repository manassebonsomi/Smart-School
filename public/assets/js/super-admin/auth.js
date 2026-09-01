(function () {

    const TOKEN_KEY = 'smart_school_access_token'
    const USER_KEY = 'smart_school_user'

    async function verifySuperAdmin() {

        const token = sessionStorage.getItem(TOKEN_KEY)

        if (!token) {
            window.location.replace('/')
            return false
        }

        try {

            const response = await fetch(
                '/api/auth/me',
                {
                    method: 'GET',

                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            )

            if (response.status === 401) {

                sessionStorage.clear()

                window.location.replace('/')

                return false
            }

            if (response.status === 403) {

                sessionStorage.clear()

                window.location.replace('/')

                return false
            }

            if (!response.ok) {

                throw new Error(
                    'Impossible de vérifier la session.'
                )
            }

            const result = await response.json()

            const user =
                result?.data?.user

            if (
                !user ||
                user.systemRole !== 'SUPER_ADMIN'
            ) {

                sessionStorage.clear()

                window.location.replace('/')

                return false
            }

            sessionStorage.setItem(
                USER_KEY,
                JSON.stringify(user)
            )

            return true

        } catch (error) {

            console.error(
                'Erreur de vérification de session:',
                error
            )

            return false
        }
    }

    window.SuperAdminAuth = {
        verify: verifySuperAdmin
    }

})()


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
            sessionStorage.getItem(
                API_TOKEN_KEY
            )


        if (!token) {

            sessionStorage.clear()

            window.location.replace('/')

            return

        }


        try {

            const response =
                await fetch(
                    '/api/auth/logout',
                    {

                        method: 'POST',

                        headers: {

                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json',

                        },

                    }
                )


            /*
             * Même si le token est déjà expiré,
             * la session locale doit être supprimée.
             */
            if (
                response.ok ||
                response.status === 401
            ) {

                sessionStorage.clear()

                window.location.replace('/')

                return

            }


            const data =
                await response
                    .json()
                    .catch(
                        () => null
                    )


            alert(
                data?.message ||
                'Impossible de terminer la déconnexion.'
            )


        } catch (error) {

            console.error(
                'Logout error:',
                error
            )


            sessionStorage.clear()

            window.location.replace('/')

        }

    }