import { Box } from 'lucide-react'
import React from 'react'
import Button from './ui/Button';
import { useOutletContext } from 'react-router';

const Navbar = () => {
    const {isSignedIn , signIn , signOut , userName} = useOutletContext<AuthContext>()
    console.log(userName)

    const handleAuthClick = async () => {
        if (isSignedIn) {
            try {
                await signOut();
            } catch (error) {
                console.error("Error occurred while signing out:", error);
            }
             return;
        }

        try {
            await signIn();
        } catch (error) {
            console.error("Error occurred while signing in:", error);
        }
     }
    return (
        <header className='navbar'>
            <nav className='inner'>
                <div className='left'>
                    <div className='brand'>
                        <Box className='logo' />
                        <span className='name'>Roomify</span>
                    </div>

                    <ul className='links'>
                        <a href="#">Products</a>
                        <a href="#">Pricing</a>
                        <a href="#">Community</a>
                        <a href="#">Enterprise</a>
                    </ul>
                </div>

                <div className='actions'>
                    {
                        isSignedIn ? (
                            <>
                                <span className='greeting'>
                                    {userName ? `HI ${userName}` : "Signed In"}
                                </span>
                                <Button size='sm' onClick={handleAuthClick} className='btn'>
                                    Log Out
                                </Button>
                            </>
                        ) : (
                            <><Button onClick={handleAuthClick} size='sm' variant='ghost'>
                                Log in
                            </Button>
                                <a href="#upload" className='cta'>
                                    Get Started
                                </a></>
                        )
                    }

                </div>
            </nav >
        </header >
    )
}

export default Navbar
