
import React from 'react'

const Home = () => {
  return (
    <main>
        <div className='interview-input-group'>
            <div className='left'>
                <textarea name="jobDescription" id="jobDescription" placeholder='enter  jon description'></textarea>

            </div>
            <div className='right'>
                <div className='input-group'>
                    <p>

                    </p>
                    <label className='file-label' htmlFor="resume">Upload resume</label>
                    <input hidden type="file" name="resume" id='resume' accept='.pdf' />

                </div>
                <div className='input-group'>
                    <label htmlFor="selfDescription"> self description</label>
                    <textarea name="selfDescription" id="selfDescription" placeholder=' enter self description'></textarea>

                </div>
                <button className='generate-btn'> generate interview report</button>


            </div>

        </div>
    </main>
  )
}

export default Home