document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm')
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

    if (!form) {
        return
    }

    function showLoginError(message) {

        if (loginError) {
            loginError.classList.remove('hidden')
        }

        if (loginErrorText) {
            loginErrorText.textContent = message
        }

        if (loginSuccess) {
            loginSuccess.classList.add('hidden')
        }
    }

    function hideLoginError() {

        if (loginError) {
            loginError.classList.add('hidden')
        }

        if (loginErrorText) {
            loginErrorText.textContent = ''
        }
    }

    function showFieldError(element, message) {

        if (!element) {
            return
        }

        element.textContent = message
        element.classList.remove('hidden')
    }

    function hideFieldErrors() {

        if (emailError) {
            emailError.textContent = ''
            emailError.classList.add('hidden')
        }

        if (passwordError) {
            passwordError.textContent = ''
            passwordError.classList.add('hidden')
        }
    }

    function setLoading(loading) {

        if (!loginButton) {
            return
        }

        loginButton.disabled = loading

        if (loading) {

            if (loginButtonText) {
                loginButtonText.textContent = 'Connexion...'
            }

            if (loginButtonIcon) {
                loginButtonIcon.classList.add('hidden')
            }

            if (loginSpinner) {
                loginSpinner.classList.remove('hidden')
            }

        } else {

            if (loginButtonText) {
                loginButtonText.textContent = 'Se connecter'
            }

            if (loginButtonIcon) {
                loginButtonIcon.classList.remove('hidden')
            }

            if (loginSpinner) {
                loginSpinner.classList.add('hidden')
            }

        }

    }

    function getErrorMessage(data) {

        if (!data) {
            return 'Une erreur est survenue lors de la connexion.'
        }

        if (data.message) {
            return data.message
        }

        if (data.errors && Array.isArray(data.errors)) {

            return data.errors[0]?.message
                || 'Les informations fournies sont invalides.'
        }

        return 'Une erreur est survenue lors de la connexion.'
    }

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener('click', () => {

            const isPassword =
                passwordInput.type === 'password'

            passwordInput.type =
                isPassword ? 'text' : 'password'

            if (passwordIcon) {

                passwordIcon.setAttribute(
                    'data-lucide',
                    isPassword ? 'eye-off' : 'eye'
                )

                if (window.lucide) {
                    lucide.createIcons()
                }
            }

        })

    }

    form.addEventListener('submit', async (event) => {

        event.preventDefault()

        hideLoginError()
        hideFieldErrors()

        const email = emailInput?.value.trim() || ''
        const password = passwordInput?.value || ''

        if (!email) {

            showFieldError(
                emailError,
                'Veuillez saisir votre adresse e-mail.'
            )

            emailInput?.focus()

            return
        }

        if (!password) {

            showFieldError(
                passwordError,
                'Veuillez saisir votre mot de passe.'
            )

            passwordInput?.focus()

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

            const data = await response.json().catch(() => null)

            if (!response.ok) {

                const message = getErrorMessage(data)

                showLoginError(message)

                if (response.status === 401) {

                    showFieldError(
                        passwordError,
                        'Identifiants incorrects.'
                    )

                }

                if (response.status === 422) {

                    showFieldError(
                        emailError,
                        message
                    )

                }

                return
            }

            const authData = data?.data

            if (!authData?.token?.value) {

                showLoginError(
                    'La connexion a réussi, mais aucun token d’authentification n’a été reçu.'
                )

                return
            }

            /*
             * Stockage du token.
             *
             * sessionStorage est utilisé par défaut.
             * Le token est conservé uniquement pour la session du navigateur.
             */
            sessionStorage.setItem(
                'smart_school_access_token',
                authData.token.value
            )

            sessionStorage.setItem(
                'smart_school_user',
                JSON.stringify(authData.user)
            )

            sessionStorage.setItem(
                'smart_school_auth',
                JSON.stringify(authData)
            )

            if (loginSuccess) {
                loginSuccess.classList.remove('hidden')
            }

            /*
             * Redirection selon le rôle.
             */
            window.location.href =
                authData.redirectTo || '/home'

        } catch (error) {

            console.error(
                'Erreur de connexion :',
                error
            )

            showLoginError(
                'Impossible de contacter le serveur. Vérifiez votre connexion puis réessayez.'
            )

        } finally {

            setLoading(false)

        }

    })

})