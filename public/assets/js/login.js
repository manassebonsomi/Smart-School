document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm')

    if (!form) {
        return
    }

    const emailInput = document.getElementById('email')
    const passwordInput = document.getElementById('password')

    const loginButton = document.getElementById('loginButton')
    const loginButtonText = document.getElementById('loginButtonText')
    const loginButtonIcon = document.getElementById('loginButtonIcon')
    const loginSpinner = document.getElementById('loginSpinner')

    const loginError = document.getElementById('loginError')
    const loginErrorText = document.getElementById('loginErrorText')
    const loginSuccess = document.getElementById('loginSuccess')

    const emailError = document.getElementById('emailError')
    const passwordError = document.getElementById('passwordError')

    const togglePassword = document.getElementById('togglePassword')
    const passwordIcon = document.getElementById('passwordIcon')


    function showError(message) {

        loginSuccess?.classList.add('hidden')

        loginError?.classList.remove('hidden')

        if (loginErrorText) {
            loginErrorText.textContent = message
        }
    }


    function clearErrors() {

        loginError?.classList.add('hidden')

        loginSuccess?.classList.add('hidden')

        emailError?.classList.add('hidden')
        passwordError?.classList.add('hidden')
    }


    function setLoading(loading) {

        if (!loginButton) {
            return
        }

        loginButton.disabled = loading

        if (loading) {

            loginButtonText.textContent = 'Connexion...'

            loginButtonIcon?.classList.add('hidden')

            loginSpinner?.classList.remove('hidden')

        } else {

            loginButtonText.textContent = 'Se connecter'

            loginButtonIcon?.classList.remove('hidden')

            loginSpinner?.classList.add('hidden')
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PASSWORD
    |--------------------------------------------------------------------------
    */

    togglePassword?.addEventListener('click', () => {

        const visible =
            passwordInput.type === 'text'

        passwordInput.type =
            visible ? 'password' : 'text'

        passwordIcon?.setAttribute(
            'data-lucide',
            visible ? 'eye' : 'eye-off'
        )

        lucide?.createIcons()
    })


    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    form.addEventListener('submit', async (event) => {

        event.preventDefault()

        clearErrors()

        const email =
            emailInput.value.trim()

        const password =
            passwordInput.value


        if (!email) {

            emailError.textContent =
                'Veuillez saisir votre adresse e-mail.'

            emailError.classList.remove('hidden')

            emailInput.focus()

            return
        }


        if (!password) {

            passwordError.textContent =
                'Veuillez saisir votre mot de passe.'

            passwordError.classList.remove('hidden')

            passwordInput.focus()

            return
        }


        setLoading(true)


        try {

            const response = await fetch(
                '/api/auth/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },

                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            )


            const result =
                await response.json().catch(() => null)


            if (!response.ok || !result?.success) {

                showError(
                    result?.message ||
                    'Adresse e-mail ou mot de passe incorrect.'
                )

                return
            }


            /*
            |--------------------------------------------------------------------------
            | RÉCUPÉRATION DES DONNÉES
            |--------------------------------------------------------------------------
            */

            const data =
                result.data


            const token =
                data?.token?.value


            const user =
                data?.user


            if (!token) {

                showError(
                    'La connexion a réussi mais le serveur n’a pas retourné de token.'
                )

                return
            }


            /*
            |--------------------------------------------------------------------------
            | STOCKAGE DE LA SESSION
            |--------------------------------------------------------------------------
            */

            sessionStorage.setItem(
                'smart_school_access_token',
                token
            )


            sessionStorage.setItem(
                'smart_school_user',
                JSON.stringify(user)
            )


            sessionStorage.setItem(
                'smart_school_auth',
                JSON.stringify(data)
            )


            /*
            |--------------------------------------------------------------------------
            | CONNEXION SUPER ADMIN
            |--------------------------------------------------------------------------
            */

            if (
                user?.systemRole === 'SUPER_ADMIN'
            ) {

                loginSuccess?.classList.remove('hidden')

                /*
                 * Petite pause pour permettre
                 * à l'utilisateur de voir le message.
                 */

                setTimeout(() => {

                    window.location.replace(
                        '/super-admin/dashboard'
                    )

                }, 400)

                return
            }


            /*
            |--------------------------------------------------------------------------
            | AUTRES UTILISATEURS
            |--------------------------------------------------------------------------
            */

            window.location.replace(
                data?.redirectTo || '/dashboard'
            )


        } catch (error) {

            console.error(
                'Erreur de connexion :',
                error
            )

            showError(
                'Impossible de contacter le serveur. Vérifiez que Smart School est démarré.'
            )

        } finally {

            setLoading(false)

        }

    })

})