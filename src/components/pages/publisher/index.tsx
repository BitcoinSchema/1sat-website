import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Collection = {
  outpoint: string;
  name: string;
  signerAddress?: string;
  image: string;
}

type PublisherCollectionProps = {
  collection: Collection;
}

const PublisherPage = async ({collection: c}: PublisherCollectionProps) => {
  const src = await import(`@/assets/images/coom/${c.image}`);

  return (
    <>
      <div key={c.outpoint} className="card sm:card-side bg-base-100 shadow-xl">
        <figure><Image width={90 * 16 / 9} height={90} alt={`${c.name} image`} src={src} /></figure>
        <div className="card-body sm:justify-between sm:flex-row">
          <h2 className="card-title justify-center">{c.name}</h2>
          <div className="card-actions justify-center">
            <Link className="btn" href={`/publisher/COOM/${c.outpoint}`}>Check</Link>
          </div>
        </div>
      </div>
      <div className="divider"></div>
    </>
  )
};

export default PublisherPage;
