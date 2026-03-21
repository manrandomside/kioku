import { createClient } from "@/lib/supabase/server";
import { getKanaWithSrsStatus } from "@/lib/queries/kana";
import { HirakataView } from "@/components/kana/hirakata-view";

export default async function HirakataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const kanaList = await getKanaWithSrsStatus(user?.id);

  return <HirakataView kanaList={kanaList} />;
}
