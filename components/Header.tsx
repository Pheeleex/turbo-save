import React from 'react'
import { Button } from './ui/button'
import Image from 'next/image'
import Search from './Search'
import { signOutUser } from '@/lib/actions/user.actions'
import FileUploader from './FileUploader'

const Header = () => {
  return (
    <header> 
        <Search />

        <div className='header-wrapper'>
            <FileUploader />
            <form
          action={async () => {
            "use server";

            await signOutUser();
          }}
        >
                <Button type='submit' className='sign-out-button'>
                    <Image
                        src='/assets/icons/logout.svg'
                        alt='logo'
                        width={24}
                        height={24}
                        className='w-6'
                    />
                </Button>
            </form>
        </div>
    </header>
  )
}

export default Header